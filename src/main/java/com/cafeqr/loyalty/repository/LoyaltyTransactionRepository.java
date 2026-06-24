package com.cafeqr.loyalty.repository;

import com.cafeqr.loyalty.domain.LoyaltyTransaction;
import com.cafeqr.loyalty.domain.LoyaltyTxnStatus;
import com.cafeqr.loyalty.domain.LoyaltyTxnType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LoyaltyTransactionRepository extends JpaRepository<LoyaltyTransaction, Long> {

    boolean existsByOrderIdAndType(Long orderId, LoyaltyTxnType type);

    Optional<LoyaltyTransaction> findByOrderIdAndTypeAndStatus(
            Long orderId, LoyaltyTxnType type, LoyaltyTxnStatus status);
}
