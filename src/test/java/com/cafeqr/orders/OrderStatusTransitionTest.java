package com.cafeqr.orders;

import com.cafeqr.orders.domain.OrderStatus;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class OrderStatusTransitionTest {

    @Test
    void pendingCanBeAcceptedOrCancelled() {
        // Since the V23 status merge, DECLINED is folded into CANCELLED, so a pre-accept reject
        // transitions PENDING -> CANCELLED (DECLINED is no longer a valid target).
        assertThat(OrderStatus.PENDING.canTransitionTo(OrderStatus.ACCEPTED)).isTrue();
        assertThat(OrderStatus.PENDING.canTransitionTo(OrderStatus.DECLINED)).isFalse();
        assertThat(OrderStatus.PENDING.canTransitionTo(OrderStatus.CANCELLED)).isTrue();
        assertThat(OrderStatus.PENDING.canTransitionTo(OrderStatus.READY)).isFalse();
        assertThat(OrderStatus.PENDING.canTransitionTo(OrderStatus.COMPLETED)).isFalse();
    }

    @Test
    void happyPathProgressesThroughEachStage() {
        // PREPARING was merged into ACCEPTED (the single "in progress" step), so the happy path is
        // now ACCEPTED -> READY -> COMPLETED. PREPARING -> READY still advances legacy tickets.
        assertThat(OrderStatus.ACCEPTED.canTransitionTo(OrderStatus.READY)).isTrue();
        assertThat(OrderStatus.PREPARING.canTransitionTo(OrderStatus.READY)).isTrue();
        assertThat(OrderStatus.READY.canTransitionTo(OrderStatus.COMPLETED)).isTrue();
    }

    @Test
    void activeStagesCanBeCancelledButReadyCannot() {
        assertThat(OrderStatus.ACCEPTED.canTransitionTo(OrderStatus.CANCELLED)).isTrue();
        assertThat(OrderStatus.PREPARING.canTransitionTo(OrderStatus.CANCELLED)).isTrue();
        assertThat(OrderStatus.READY.canTransitionTo(OrderStatus.CANCELLED)).isFalse();
    }

    @Test
    void terminalStatesAreFinal() {
        assertThat(OrderStatus.DECLINED.isFinal()).isTrue();
        assertThat(OrderStatus.COMPLETED.isFinal()).isTrue();
        assertThat(OrderStatus.CANCELLED.isFinal()).isTrue();
        assertThat(OrderStatus.DECLINED.canTransitionTo(OrderStatus.ACCEPTED)).isFalse();
        assertThat(OrderStatus.COMPLETED.canTransitionTo(OrderStatus.READY)).isFalse();
    }
}
