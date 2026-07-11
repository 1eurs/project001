package com.cafeqr.orders.print.repository;

import com.cafeqr.orders.print.domain.PrintJob;
import com.cafeqr.orders.print.domain.PrintJobStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PrintJobRepository extends JpaRepository<PrintJob, Long> {

    List<PrintJob> findByBranchIdAndStatusOrderByIdAsc(Long branchId, PrintJobStatus status);

    boolean existsByOrderIdAndStatus(Long orderId, PrintJobStatus status);
}
