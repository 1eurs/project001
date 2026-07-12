package com.cafeqr.payments;

import com.cafeqr.auth.security.AccessGuard;
import com.cafeqr.common.exception.ResourceNotFoundException;
import com.cafeqr.orders.domain.Order;
import com.cafeqr.orders.domain.PaymentStatus;
import com.cafeqr.orders.repository.OrderRepository;
import com.cafeqr.payments.domain.Payment;
import com.cafeqr.payments.domain.PaymentMethod;
import com.cafeqr.payments.dto.PaymentResponse;
import com.cafeqr.payments.repository.PaymentRepository;
import com.cafeqr.restaurants.RestaurantService;
import com.cafeqr.restaurants.domain.Restaurant;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Manual payment status management. A real gateway (Thawani / Tap) can later create
 * {@link Payment} rows with a real {@code provider} and {@code providerPaymentId}.
 */
@Service
public class PaymentService {

    private static final String STUB_PROVIDER = "STUB";

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final RestaurantService restaurantService;
    private final AccessGuard accessGuard;

    public PaymentService(PaymentRepository paymentRepository,
                          OrderRepository orderRepository,
                          RestaurantService restaurantService,
                          AccessGuard accessGuard) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.restaurantService = restaurantService;
        this.accessGuard = accessGuard;
    }

    @Transactional
    public PaymentResponse markPaid(Long orderId, PaymentMethod method) {
        // Most cafe orders are paid in person; default to CARD when unspecified.
        return record(orderId, PaymentStatus.PAID, method != null ? method : PaymentMethod.CARD);
    }

    @Transactional
    public PaymentResponse markFailed(Long orderId) {
        return record(orderId, PaymentStatus.FAILED, null);
    }

    private PaymentResponse record(Long orderId, PaymentStatus status, PaymentMethod method) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> ResourceNotFoundException.of("Order", orderId));
        accessGuard.requireBranchAccess(order.getRestaurantId(), order.getBranchId());
        Restaurant restaurant = restaurantService.getEntity(order.getRestaurantId());

        order.setPaymentStatus(status);
        // Mirror the method onto the order so dashboard reads and printed receipts get it
        // without joining the ledger. Only meaningful for PAID; a failure leaves it as-is.
        if (status == PaymentStatus.PAID) {
            order.setPaymentMethod(method);
        }

        Payment payment = new Payment();
        payment.setOrderId(order.getId());
        payment.setProvider(method == PaymentMethod.ONLINE ? STUB_PROVIDER : "IN_PERSON");
        payment.setAmount(order.getTotal());
        payment.setCurrency(restaurant.getCurrency());
        payment.setStatus(status);
        payment.setMethod(method);
        return PaymentResponse.from(paymentRepository.save(payment));
    }
}
