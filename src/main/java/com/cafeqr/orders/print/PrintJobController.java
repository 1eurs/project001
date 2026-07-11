package com.cafeqr.orders.print;

import com.cafeqr.common.api.ApiResponse;
import com.cafeqr.orders.print.dto.PrintJobResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard/print-jobs")
@Tag(name = "Dashboard print jobs")
@PreAuthorize("hasAuthority('ORDERS')")
public class PrintJobController {

    private final PrintJobService printJobService;

    public PrintJobController(PrintJobService printJobService) {
        this.printJobService = printJobService;
    }

    @Operation(summary = "Pending receipt print jobs for a branch (print-station pull)")
    @GetMapping
    public ApiResponse<List<PrintJobResponse>> pending(@RequestParam Long branchId) {
        return ApiResponse.ok(printJobService.pendingForBranch(branchId));
    }

    @Operation(summary = "Acknowledge a print job after the receipt was handed to the printer")
    @PostMapping("/{jobId}/ack")
    public ApiResponse<Void> acknowledge(@PathVariable Long jobId) {
        printJobService.acknowledge(jobId);
        return ApiResponse.message("Print job acknowledged");
    }
}
