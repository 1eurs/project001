package com.cafeqr.orders.print;

import com.cafeqr.auth.security.AccessGuard;
import com.cafeqr.branches.BranchService;
import com.cafeqr.common.exception.ResourceNotFoundException;
import com.cafeqr.orders.domain.Order;
import com.cafeqr.orders.dto.OrderResponse;
import com.cafeqr.orders.print.domain.PrintJob;
import com.cafeqr.orders.print.domain.PrintJobStatus;
import com.cafeqr.orders.print.dto.PrintJobResponse;
import com.cafeqr.orders.print.repository.PrintJobRepository;
import com.cafeqr.orders.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
public class PrintJobService {

    /**
     * A pending job older than this is expired instead of printed — a tablet waking after a
     * long sleep must not print a stack of receipts for orders picked up half an hour ago.
     */
    private static final Duration FRESHNESS_WINDOW = Duration.ofMinutes(15);

    private final PrintJobRepository printJobRepository;
    private final OrderRepository orderRepository;
    private final BranchService branchService;
    private final AccessGuard accessGuard;

    public PrintJobService(PrintJobRepository printJobRepository,
                           OrderRepository orderRepository,
                           BranchService branchService,
                           AccessGuard accessGuard) {
        this.printJobRepository = printJobRepository;
        this.orderRepository = orderRepository;
        this.branchService = branchService;
        this.accessGuard = accessGuard;
    }

    /**
     * Called from OrderService.complete() inside the same transaction — the job row commits
     * atomically with the completion, so the SSE event that follows commit can never observe
     * a missing job. No-op when the branch hasn't enabled auto-print.
     */
    @Transactional
    public void enqueueIfEnabled(Order order) {
        if (!branchService.getEntity(order.getBranchId()).isPrinterEnabled()) {
            return;
        }
        if (printJobRepository.existsByOrderIdAndStatus(order.getId(), PrintJobStatus.PENDING)) {
            return;
        }
        PrintJob job = new PrintJob();
        job.setRestaurantId(order.getRestaurantId());
        job.setBranchId(order.getBranchId());
        job.setOrderId(order.getId());
        job.setStatus(PrintJobStatus.PENDING);
        printJobRepository.save(job);
    }

    /** Pending jobs for the branch's print station; stale ones are expired en passant. */
    @Transactional
    public List<PrintJobResponse> pendingForBranch(Long branchId) {
        var branch = branchService.getEntity(branchId);
        accessGuard.requireBranchAccess(branch.getRestaurantId(), branch.getId());

        Instant cutoff = Instant.now().minus(FRESHNESS_WINDOW);
        return printJobRepository.findByBranchIdAndStatusOrderByIdAsc(branchId, PrintJobStatus.PENDING)
                .stream()
                .filter(job -> {
                    if (job.getCreatedAt().isBefore(cutoff)) {
                        job.setStatus(PrintJobStatus.EXPIRED);
                        return false;
                    }
                    return true;
                })
                .map(job -> PrintJobResponse.of(job, orderRepository.findById(job.getOrderId())
                        .map(OrderResponse::from)
                        .orElse(null)))
                .filter(response -> response.order() != null)
                .toList();
    }

    /** Idempotent — acking an already-printed or expired job is a harmless no-op. */
    @Transactional
    public void acknowledge(Long jobId) {
        PrintJob job = printJobRepository.findById(jobId)
                .orElseThrow(() -> ResourceNotFoundException.of("PrintJob", jobId));
        accessGuard.requireBranchAccess(job.getRestaurantId(), job.getBranchId());
        if (job.getStatus() == PrintJobStatus.PENDING) {
            job.setStatus(PrintJobStatus.PRINTED);
            job.setPrintedAt(Instant.now());
        }
    }
}
