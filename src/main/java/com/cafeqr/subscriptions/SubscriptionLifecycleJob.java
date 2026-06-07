package com.cafeqr.subscriptions;

import com.cafeqr.common.config.AppProperties;
import com.cafeqr.notifications.email.EmailMessage;
import com.cafeqr.notifications.email.EmailSender;
import com.cafeqr.restaurants.RestaurantService;
import com.cafeqr.subscriptions.domain.Subscription;
import com.cafeqr.subscriptions.domain.SubscriptionStatus;
import com.cafeqr.subscriptions.repository.SubscriptionRepository;
import com.cafeqr.users.domain.Role;
import com.cafeqr.users.domain.User;
import com.cafeqr.users.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Daily annual-billing housekeeping: moves lapsed subscriptions through
 * {@code ACTIVE → PAST_DUE → (after grace) EXPIRED}, takes expired cafés offline, and emails
 * renewal reminders. Lifetime ({@code ONE_TIME}, no end date) subscriptions are left untouched.
 */
@Component
public class SubscriptionLifecycleJob {

    private static final Logger log = LoggerFactory.getLogger("subscriptions.lifecycle");

    private final SubscriptionRepository subscriptionRepository;
    private final RestaurantService restaurantService;
    private final UserRepository userRepository;
    private final EmailSender email;
    private final AppProperties appProperties;

    public SubscriptionLifecycleJob(SubscriptionRepository subscriptionRepository,
                                    RestaurantService restaurantService,
                                    UserRepository userRepository,
                                    EmailSender email,
                                    AppProperties appProperties) {
        this.subscriptionRepository = subscriptionRepository;
        this.restaurantService = restaurantService;
        this.userRepository = userRepository;
        this.email = email;
        this.appProperties = appProperties;
    }

    /** Runs daily at 02:15. */
    @Scheduled(cron = "${app.subscription.cron:0 15 2 * * *}")
    @Transactional
    public void run() {
        runFor(LocalDate.now());
    }

    /** Extracted for testability — apply lifecycle transitions as of {@code today}. */
    @Transactional
    public void runFor(LocalDate today) {
        AppProperties.Subscription cfg = appProperties.subscription();
        int graceDays = cfg != null ? cfg.graceDaysOrDefault() : 7;
        List<Integer> reminderOffsets = cfg != null ? cfg.reminderDaysBeforeOrDefault() : List.of(14, 7, 1);

        List<Subscription> subs = subscriptionRepository.findByStatusIn(
                List.of(SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE));

        for (Subscription s : subs) {
            LocalDate end = s.getEndDate();
            if (end == null) {
                continue; // lifetime / no fixed term — never expires
            }
            boolean remind = false;

            if (s.getStatus() == SubscriptionStatus.ACTIVE) {
                if (end.isBefore(today)) {
                    s.setStatus(SubscriptionStatus.PAST_DUE); // grace begins; café stays live
                    remind = true;                            // nudge the day it lapses
                } else {
                    long daysUntil = ChronoUnit.DAYS.between(today, end);
                    remind = reminderOffsets.contains((int) daysUntil); // pre-expiry nudges
                }
            } else if (s.getStatus() == SubscriptionStatus.PAST_DUE
                    && end.isBefore(today.minusDays(graceDays))) {
                s.setStatus(SubscriptionStatus.EXPIRED);
                restaurantService.setActive(s.getRestaurantId(), false); // menu offline until renewed
                log.info("Subscription {} EXPIRED — restaurant {} taken offline", s.getId(), s.getRestaurantId());
            }

            if (remind && !today.equals(s.getLastReminderOn())) {
                sendReminder(s);
                s.setLastReminderOn(today);
            }
        }
    }

    private void sendReminder(Subscription s) {
        owner(s.getRestaurantId()).ifPresent(owner -> {
            AppProperties.Onboarding o = appProperties.onboarding();
            String amount = (s.getPrice() != null ? s.getPrice().toPlainString() : "")
                    + " " + (o != null ? o.currency() : "OMR");
            String text = """
                    Hi %s,

                    Your Serva subscription expires on %s. To keep your menu live, transfer %s
                    and put this reference in the note:

                      Reference:      %s
                      Bank:           %s
                      Account name:   %s
                      Account number: %s
                      IBAN:           %s

                    We'll extend your subscription once we confirm the transfer.

                    — Serva

                    ------------------------------------------------------------

                    مرحباً %s،

                    ينتهي اشتراكك في Serva بتاريخ %s. لإبقاء قائمتك فعّالة، حوّل %s واكتب الرمز المرجعي في الملاحظة:

                      الرمز المرجعي: %s
                      البنك:        %s
                      اسم الحساب:    %s
                      رقم الحساب:    %s
                      الآيبان:       %s

                    سنمدّد اشتراكك فور تأكيد التحويل.
                    """.formatted(
                    owner.getFullName(), s.getEndDate(), amount, s.getPaymentReference(),
                    bank(o), accName(o), accNo(o), iban(o),
                    owner.getFullName(), s.getEndDate(), amount, s.getPaymentReference(),
                    bank(o), accName(o), accNo(o), iban(o));
            email.send(new EmailMessage(owner.getEmail(), "Your Serva subscription is expiring — renew", null, text));
        });
    }

    private java.util.Optional<User> owner(Long restaurantId) {
        return userRepository.findByRestaurantIdOrderByIdAsc(restaurantId).stream()
                .filter(u -> u.getRole() == Role.RESTAURANT_OWNER)
                .findFirst();
    }

    private static String bank(AppProperties.Onboarding o) { return o != null ? o.bankName() : ""; }
    private static String accName(AppProperties.Onboarding o) { return o != null ? o.accountName() : ""; }
    private static String accNo(AppProperties.Onboarding o) { return o != null ? o.accountNumber() : ""; }
    private static String iban(AppProperties.Onboarding o) { return o != null ? o.iban() : ""; }
}
