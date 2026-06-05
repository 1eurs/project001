package com.cafeqr.orders;

import com.cafeqr.orders.domain.OrderStatus;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class OrderStatusTransitionTest {

    @Test
    void pendingCanBeAcceptedDeclinedOrCancelled() {
        assertThat(OrderStatus.PENDING.canTransitionTo(OrderStatus.ACCEPTED)).isTrue();
        assertThat(OrderStatus.PENDING.canTransitionTo(OrderStatus.DECLINED)).isTrue();
        assertThat(OrderStatus.PENDING.canTransitionTo(OrderStatus.CANCELLED)).isTrue();
        assertThat(OrderStatus.PENDING.canTransitionTo(OrderStatus.READY)).isFalse();
        assertThat(OrderStatus.PENDING.canTransitionTo(OrderStatus.COMPLETED)).isFalse();
    }

    @Test
    void happyPathProgressesThroughEachStage() {
        assertThat(OrderStatus.ACCEPTED.canTransitionTo(OrderStatus.PREPARING)).isTrue();
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
