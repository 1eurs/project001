package com.cafeqr.loyalty;

import com.cafeqr.auth.security.AccessGuard;
import com.cafeqr.common.exception.BadRequestException;
import com.cafeqr.common.util.Phones;
import com.cafeqr.loyalty.domain.LoyaltyMember;
import com.cafeqr.loyalty.domain.LoyaltyProgram;
import com.cafeqr.loyalty.domain.LoyaltyTransaction;
import com.cafeqr.loyalty.domain.LoyaltyTxnStatus;
import com.cafeqr.loyalty.domain.LoyaltyTxnType;
import com.cafeqr.loyalty.dto.LoyaltyMemberResponse;
import com.cafeqr.loyalty.dto.LoyaltyPortalEntryResponse;
import com.cafeqr.loyalty.dto.LoyaltyProgramRequest;
import com.cafeqr.loyalty.dto.LoyaltyProgramResponse;
import com.cafeqr.loyalty.dto.LoyaltySummaryResponse;
import com.cafeqr.loyalty.repository.LoyaltyMemberRepository;
import com.cafeqr.loyalty.repository.LoyaltyProgramRepository;
import com.cafeqr.loyalty.repository.LoyaltyTransactionRepository;
import com.cafeqr.orders.domain.Order;
import com.cafeqr.orders.domain.OrderItem;
import com.cafeqr.restaurants.RestaurantService;
import com.cafeqr.restaurants.domain.Restaurant;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * Stamp-card loyalty: café configuration, per-(restaurant, phone) balances, and the order-flow
 * hooks that earn stamps and reserve/confirm/void reward redemptions. The {@link LoyaltyMember}
 * counters are the operational source of truth (mutated under a row lock); the
 * {@link LoyaltyTransaction} ledger provides per-order idempotency and audit.
 */
@Service
public class LoyaltyService {

    private static final int MONEY_SCALE = 3;

    private final LoyaltyProgramRepository programRepository;
    private final LoyaltyMemberRepository memberRepository;
    private final LoyaltyTransactionRepository txnRepository;
    private final RestaurantService restaurantService;
    private final AccessGuard accessGuard;

    public LoyaltyService(LoyaltyProgramRepository programRepository,
                          LoyaltyMemberRepository memberRepository,
                          LoyaltyTransactionRepository txnRepository,
                          RestaurantService restaurantService,
                          AccessGuard accessGuard) {
        this.programRepository = programRepository;
        this.memberRepository = memberRepository;
        this.txnRepository = txnRepository;
        this.restaurantService = restaurantService;
        this.accessGuard = accessGuard;
    }

    // ============================================================ dashboard (café config)

    @Transactional(readOnly = true)
    public LoyaltyProgramResponse getProgram() {
        Long restaurantId = requireCafeScope();
        return programRepository.findByRestaurantId(restaurantId)
                .map(LoyaltyProgramResponse::from)
                .orElseGet(() -> new LoyaltyProgramResponse(false, 8, "", null, null));
    }

    @Transactional
    public LoyaltyProgramResponse updateProgram(LoyaltyProgramRequest req) {
        Long restaurantId = requireCafeScope();
        if (req.enabled() && req.rewardItemId() == null) {
            throw new BadRequestException("Choose the free reward item before enabling loyalty.");
        }
        LoyaltyProgram program = programRepository.findByRestaurantId(restaurantId)
                .orElseGet(() -> {
                    LoyaltyProgram p = new LoyaltyProgram();
                    p.setRestaurantId(restaurantId);
                    return p;
                });
        program.setEnabled(req.enabled());
        program.setStampsRequired(req.stampsRequired());
        program.setRewardLabel(req.rewardLabel().trim());
        program.setRewardItemId(req.rewardItemId());
        program.setMinOrderAmount(req.minOrderAmount());
        return LoyaltyProgramResponse.from(programRepository.save(program));
    }

    @Transactional(readOnly = true)
    public List<LoyaltyMemberResponse> listMembers() {
        Long restaurantId = requireCafeScope();
        return memberRepository.findTop200ByRestaurantIdOrderByUpdatedAtDesc(restaurantId)
                .stream().map(LoyaltyMemberResponse::from).toList();
    }

    // ============================================================ public (customer)

    /** One café's stamp progress for a phone (checkout redeem toggle). */
    @Transactional(readOnly = true)
    public LoyaltySummaryResponse summaryFor(String slug, String rawPhone) {
        Restaurant restaurant = restaurantService.getActiveBySlug(slug);
        return summaryForRestaurant(restaurant.getId(), Phones.normalize(rawPhone));
    }

    /** Same as {@link #summaryFor} but keyed by restaurant id + already-normalized phone (menu banner). */
    @Transactional(readOnly = true)
    public LoyaltySummaryResponse summaryForRestaurant(Long restaurantId, String normalizedPhone) {
        LoyaltyProgram program = programRepository.findByRestaurantId(restaurantId)
                .filter(LoyaltyProgram::isEnabled).orElse(null);
        if (program == null) {
            return LoyaltySummaryResponse.disabled();
        }
        LoyaltyMember member = normalizedPhone == null ? null
                : memberRepository.findByRestaurantIdAndPhone(restaurantId, normalizedPhone).orElse(null);
        return LoyaltySummaryResponse.of(program, member);
    }

    /** Every café's stamp card for an OTP-verified (normalized) phone — the cross-café portal. */
    @Transactional(readOnly = true)
    public List<LoyaltyPortalEntryResponse> portalFor(String normalizedPhone) {
        if (normalizedPhone == null || normalizedPhone.isBlank()) {
            return List.of();
        }
        List<LoyaltyPortalEntryResponse> out = new ArrayList<>();
        for (LoyaltyMember m : memberRepository.findByPhoneOrderByUpdatedAtDesc(normalizedPhone)) {
            LoyaltyProgram program = programRepository.findByRestaurantId(m.getRestaurantId())
                    .filter(LoyaltyProgram::isEnabled).orElse(null);
            if (program == null) {
                continue; // café turned loyalty off — hide it from the portal
            }
            Restaurant r = restaurantService.getEntity(m.getRestaurantId());
            out.add(new LoyaltyPortalEntryResponse(
                    r.getSlug(), r.getName(), r.getLogoUrl(),
                    program.getStampsRequired(), program.getRewardLabel(),
                    m.getStamps(), m.getAvailableRewards(), m.getUpdatedAt()));
        }
        return out;
    }

    // ============================================================ order-flow hooks

    /**
     * Reserves a reward redemption on a freshly saved order: validates the customer has a reward
     * and the free item is in the cart, consumes one available reward, writes a PENDING REDEEM
     * ledger row, and applies the discount (one priced unit of the reward item) to the order total.
     * No-op when {@code redeemRequested} is false. Throws when requested but not satisfiable so the
     * order is not created with an unbacked discount.
     */
    @Transactional
    public void applyRedemption(Order order, boolean redeemRequested) {
        if (!redeemRequested) {
            return;
        }
        String phone = order.getCustomerPhone();
        if (phone == null) {
            throw new BadRequestException("A phone number is required to redeem a reward.");
        }
        LoyaltyProgram program = programRepository.findByRestaurantId(order.getRestaurantId())
                .filter(LoyaltyProgram::isEnabled)
                .orElseThrow(() -> new BadRequestException("This café has no active loyalty program."));
        if (program.getRewardItemId() == null) {
            throw new BadRequestException("This café's loyalty reward is not set up yet.");
        }
        OrderItem rewardLine = order.getItems().stream()
                .filter(i -> program.getRewardItemId().equals(i.getMenuItemId()))
                .findFirst()
                .orElseThrow(() -> new BadRequestException(
                        "Add the reward item to your cart to redeem your reward."));
        LoyaltyMember member = memberRepository
                .lockByRestaurantIdAndPhone(order.getRestaurantId(), phone)
                .orElse(null);
        if (member == null || member.getAvailableRewards() < 1) {
            throw new BadRequestException("You don't have a reward available to redeem yet.");
        }

        member.setAvailableRewards(member.getAvailableRewards() - 1);
        memberRepository.save(member);
        txnRepository.save(redemptionTxn(order, phone));

        BigDecimal discount = rewardLine.getPriceSnapshot()
                .min(order.getTotal())
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        order.setLoyaltyRewardLabel(program.getRewardLabel());
        order.setLoyaltyRewardDiscount(discount);
        order.setTotal(order.getTotal().subtract(discount));
    }

    /** On completion: earn a stamp (idempotent, if the order qualifies) and confirm any reserved reward. */
    @Transactional
    public void onOrderCompleted(Order order) {
        String phone = order.getCustomerPhone();
        if (phone == null) {
            return;
        }
        LoyaltyProgram program = programRepository.findByRestaurantId(order.getRestaurantId())
                .filter(LoyaltyProgram::isEnabled).orElse(null);
        if (program != null
                && !txnRepository.existsByOrderIdAndType(order.getId(), LoyaltyTxnType.EARN)
                && qualifiesForStamp(program, order)) {
            LoyaltyMember member = getOrCreateLockedMember(
                    order.getRestaurantId(), phone, order.getCustomerName());
            member.setLifetimeStamps(member.getLifetimeStamps() + 1);
            int stamps = member.getStamps() + 1;
            if (stamps >= program.getStampsRequired()) {
                stamps -= program.getStampsRequired();
                member.setAvailableRewards(member.getAvailableRewards() + 1);
            }
            member.setStamps(stamps);
            if (member.getName() == null && order.getCustomerName() != null) {
                member.setName(order.getCustomerName());
            }
            memberRepository.save(member);

            LoyaltyTransaction earn = new LoyaltyTransaction();
            earn.setRestaurantId(order.getRestaurantId());
            earn.setPhone(phone);
            earn.setOrderId(order.getId());
            earn.setType(LoyaltyTxnType.EARN);
            earn.setStatus(LoyaltyTxnStatus.CONFIRMED);
            earn.setStampsDelta(1);
            txnRepository.save(earn);
        }
        confirmPendingRedemption(order, phone);
    }

    /** On cancellation/decline: void any reserved reward and return it to the member. */
    @Transactional
    public void onOrderCancelled(Order order) {
        String phone = order.getCustomerPhone();
        if (phone == null) {
            return;
        }
        txnRepository.findByOrderIdAndTypeAndStatus(
                        order.getId(), LoyaltyTxnType.REDEEM, LoyaltyTxnStatus.PENDING)
                .ifPresent(txn -> {
                    txn.setStatus(LoyaltyTxnStatus.VOID);
                    txnRepository.save(txn);
                    memberRepository.lockByRestaurantIdAndPhone(order.getRestaurantId(), phone)
                            .ifPresent(m -> {
                                m.setAvailableRewards(m.getAvailableRewards() + 1);
                                memberRepository.save(m);
                            });
                });
    }

    // ============================================================ helpers

    private void confirmPendingRedemption(Order order, String phone) {
        txnRepository.findByOrderIdAndTypeAndStatus(
                        order.getId(), LoyaltyTxnType.REDEEM, LoyaltyTxnStatus.PENDING)
                .ifPresent(txn -> {
                    txn.setStatus(LoyaltyTxnStatus.CONFIRMED);
                    txnRepository.save(txn);
                    memberRepository.lockByRestaurantIdAndPhone(order.getRestaurantId(), phone)
                            .ifPresent(m -> {
                                m.setRewardsRedeemed(m.getRewardsRedeemed() + 1);
                                memberRepository.save(m);
                            });
                });
    }

    private LoyaltyTransaction redemptionTxn(Order order, String phone) {
        LoyaltyTransaction txn = new LoyaltyTransaction();
        txn.setRestaurantId(order.getRestaurantId());
        txn.setPhone(phone);
        txn.setOrderId(order.getId());
        txn.setType(LoyaltyTxnType.REDEEM);
        txn.setStatus(LoyaltyTxnStatus.PENDING);
        txn.setStampsDelta(0);
        return txn;
    }

    private boolean qualifiesForStamp(LoyaltyProgram program, Order order) {
        BigDecimal min = program.getMinOrderAmount();
        if (min == null || min.signum() <= 0) {
            return true;
        }
        return order.getTotal() != null && order.getTotal().compareTo(min) >= 0;
    }

    private LoyaltyMember getOrCreateLockedMember(Long restaurantId, String phone, String name) {
        return memberRepository.lockByRestaurantIdAndPhone(restaurantId, phone)
                .orElseGet(() -> {
                    LoyaltyMember m = new LoyaltyMember();
                    m.setRestaurantId(restaurantId);
                    m.setPhone(phone);
                    m.setName(name);
                    return memberRepository.save(m);
                });
    }

    private Long requireCafeScope() {
        Long restaurantId = accessGuard.scopedRestaurantId();
        if (restaurantId == null) {
            throw new BadRequestException("Only café staff can manage loyalty.");
        }
        return restaurantId;
    }
}
