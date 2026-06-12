package com.cafeqr.onboarding;

import com.cafeqr.branches.BranchService;
import com.cafeqr.common.config.AppProperties;
import com.cafeqr.common.exception.BadRequestException;
import com.cafeqr.common.exception.ConflictException;
import com.cafeqr.common.exception.ErrorCode;
import com.cafeqr.common.exception.ResourceNotFoundException;
import com.cafeqr.common.util.Tokens;
import com.cafeqr.onboarding.dto.OnboardingInstructionsResponse;
import com.cafeqr.onboarding.dto.OnboardingSignupRequest;
import com.cafeqr.onboarding.dto.PendingOnboardingResponse;
import com.cafeqr.onboarding.event.CafeActivatedEvent;
import com.cafeqr.onboarding.event.CafeRenewedEvent;
import com.cafeqr.onboarding.event.CafeSignedUpEvent;
import com.cafeqr.restaurants.RestaurantService;
import com.cafeqr.restaurants.domain.Restaurant;
import com.cafeqr.restaurants.dto.RestaurantResponse;
import com.cafeqr.subscriptions.domain.BillingCycle;
import com.cafeqr.subscriptions.domain.PaymentMethod;
import com.cafeqr.subscriptions.domain.Subscription;
import com.cafeqr.subscriptions.domain.SubscriptionStatus;
import com.cafeqr.subscriptions.repository.SubscriptionRepository;
import com.cafeqr.users.domain.Role;
import com.cafeqr.users.domain.User;
import com.cafeqr.users.repository.UserRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Orchestrates self-serve café onboarding: a public signup creates an inactive restaurant,
 * a disabled owner account and a {@code PENDING_PAYMENT} subscription; a platform admin later
 * confirms the bank transfer, which activates everything so the owner can sign in.
 */
@Service
public class OnboardingService {

    private final RestaurantService restaurantService;
    private final BranchService branchService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SubscriptionRepository subscriptionRepository;
    private final AppProperties appProperties;
    private final ApplicationEventPublisher events;

    public OnboardingService(RestaurantService restaurantService,
                             BranchService branchService,
                             UserRepository userRepository,
                             PasswordEncoder passwordEncoder,
                             SubscriptionRepository subscriptionRepository,
                             AppProperties appProperties,
                             ApplicationEventPublisher events) {
        this.restaurantService = restaurantService;
        this.branchService = branchService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.subscriptionRepository = subscriptionRepository;
        this.appProperties = appProperties;
        this.events = events;
    }

    @Transactional
    public OnboardingInstructionsResponse signup(OnboardingSignupRequest req) {
        if (userRepository.existsByEmailIgnoreCase(req.email())) {
            throw new ConflictException(ErrorCode.EMAIL_ALREADY_EXISTS, "Email is already registered");
        }
        AppProperties.Onboarding cfg = appProperties.onboarding();

        // Restaurant stays inactive (public menu offline) until the admin confirms payment.
        Restaurant restaurant = restaurantService.createPending(req.cafeName(), req.slug(), req.phone(), req.email());

        // Every café needs at least one branch — tables, QR codes and the live board all hang off it.
        // Create a default branch now so the owner's dashboard works the moment they're activated.
        branchService.createDefault(restaurant.getId(), req.cafeName());

        // Owner is disabled, so login is blocked until activated — this is the "locked until paid" gate.
        User owner = new User();
        owner.setFullName(req.ownerName());
        owner.setEmail(req.email());
        owner.setPhone(req.phone());
        owner.setPasswordHash(passwordEncoder.encode(req.password()));
        owner.setRole(Role.RESTAURANT_OWNER);
        owner.setRestaurantId(restaurant.getId());
        owner.setActive(false);
        userRepository.save(owner);

        String reference = generateReference();
        Subscription subscription = new Subscription();
        subscription.setRestaurantId(restaurant.getId());
        subscription.setPlanName(cfg.planName());
        subscription.setBillingCycle(BillingCycle.YEARLY);
        subscription.setPrice(cfg.price());
        subscription.setStatus(SubscriptionStatus.PENDING_PAYMENT);
        subscription.setStartDate(LocalDate.now());
        // endDate stays null until payment is confirmed — the paid term starts then.
        subscription.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        subscription.setPaymentReference(reference);
        subscriptionRepository.save(subscription);

        // Emailed after commit (so a rollback never sends): instructions to the café + admin alert.
        events.publishEvent(new CafeSignedUpEvent(
                owner.getEmail(), owner.getFullName(), restaurant.getName(),
                reference, cfg.price(), cfg.currency()));

        return new OnboardingInstructionsResponse(
                restaurant.getSlug(), reference, cfg.price(), cfg.currency(),
                cfg.bankName(), cfg.accountName(), cfg.accountNumber(), cfg.iban());
    }

    @Transactional(readOnly = true)
    public List<PendingOnboardingResponse> listPending() {
        return subscriptionRepository.findByStatusOrderByIdDesc(SubscriptionStatus.PENDING_PAYMENT)
                .stream().map(this::toPending).toList();
    }

    /** Confirms the bank transfer: activates the subscription, restaurant and owner account. */
    @Transactional
    public void confirm(Long restaurantId, Long adminUserId) {
        Subscription subscription = pendingSubscription(restaurantId);
        LocalDate today = LocalDate.now();
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setStartDate(today);
        subscription.setEndDate(today.plusMonths(termMonths()));
        subscription.setPaymentConfirmedAt(Instant.now());
        subscription.setPaymentConfirmedBy(adminUserId);

        RestaurantResponse restaurant = restaurantService.setActive(restaurantId, true);
        activateOwners(restaurantId);
        // Heal cafés onboarded before branches were auto-created (idempotent).
        branchService.ensureDefaultBranch(restaurantId, restaurant.name());

        // "You're live" email to the owner, after commit.
        ownerOf(restaurantId).ifPresent(owner -> events.publishEvent(new CafeActivatedEvent(
                owner.getEmail(), owner.getFullName(), restaurant.name(), restaurant.slug())));
    }

    /**
     * Confirms a renewal payment: extends the term by another period and re-activates the café if it
     * had lapsed. Renewing early stacks onto the remaining time (no lost days).
     */
    @Transactional
    public void renew(Long restaurantId, Long adminUserId) {
        Subscription subscription = subscriptionRepository.findFirstByRestaurantIdOrderByIdDesc(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No subscription found for restaurant " + restaurantId));
        if (subscription.getBillingCycle() == BillingCycle.ONE_TIME) {
            throw new BadRequestException("One-time subscriptions do not renew");
        }
        LocalDate today = LocalDate.now();
        LocalDate base = (subscription.getEndDate() != null && subscription.getEndDate().isAfter(today))
                ? subscription.getEndDate() : today;
        subscription.setEndDate(base.plusMonths(termMonths()));
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setPaymentConfirmedAt(Instant.now());
        subscription.setPaymentConfirmedBy(adminUserId);

        RestaurantResponse restaurant = restaurantService.setActive(restaurantId, true);
        activateOwners(restaurantId);
        branchService.ensureDefaultBranch(restaurantId, restaurant.name());

        LocalDate endDate = subscription.getEndDate();
        ownerOf(restaurantId).ifPresent(owner -> events.publishEvent(new CafeRenewedEvent(
                owner.getEmail(), owner.getFullName(), restaurant.name(), endDate)));
    }

    /** Rejects the pending payment; the restaurant and owner stay inactive. */
    @Transactional
    public void reject(Long restaurantId) {
        Subscription subscription = pendingSubscription(restaurantId);
        subscription.setStatus(SubscriptionStatus.CANCELLED);
    }

    // ----------------------------------------------------------------- internals

    private PendingOnboardingResponse toPending(Subscription subscription) {
        Restaurant restaurant = restaurantService.getEntity(subscription.getRestaurantId());
        User owner = ownerOf(restaurant.getId()).orElse(null);
        return new PendingOnboardingResponse(
                restaurant.getId(), restaurant.getName(), restaurant.getSlug(),
                owner != null ? owner.getFullName() : null,
                owner != null ? owner.getEmail() : null,
                restaurant.getPhone(), subscription.getPrice(),
                subscription.getPaymentReference(), subscription.getCreatedAt());
    }

    private Subscription pendingSubscription(Long restaurantId) {
        Subscription subscription = subscriptionRepository.findFirstByRestaurantIdOrderByIdDesc(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No onboarding payment found for restaurant " + restaurantId));
        if (subscription.getStatus() != SubscriptionStatus.PENDING_PAYMENT) {
            throw new BadRequestException("This restaurant has no pending onboarding payment");
        }
        return subscription;
    }

    private void activateOwners(Long restaurantId) {
        userRepository.findByRestaurantIdOrderByIdAsc(restaurantId).stream()
                .filter(u -> u.getRole() == Role.RESTAURANT_OWNER)
                .forEach(u -> u.setActive(true));
    }

    private Optional<User> ownerOf(Long restaurantId) {
        return userRepository.findByRestaurantIdOrderByIdAsc(restaurantId).stream()
                .filter(u -> u.getRole() == Role.RESTAURANT_OWNER)
                .findFirst();
    }

    private int termMonths() {
        AppProperties.Subscription cfg = appProperties.subscription();
        return cfg != null ? cfg.termMonthsOrDefault() : 12;
    }

    /** Short, human-citable transfer reference, e.g. {@code SV-7KQ2M9}. */
    private String generateReference() {
        String raw = Tokens.random(8).replaceAll("[^A-Za-z0-9]", "");
        return "SV-" + raw.substring(0, Math.min(6, raw.length())).toUpperCase();
    }
}
