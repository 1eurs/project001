package com.cafeqr.presence;

import com.cafeqr.common.api.ApiResponse;
import com.cafeqr.presence.dto.QrActivityResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@Tag(name = "QR activity")
@PreAuthorize("hasAnyRole('PLATFORM_ADMIN','RESTAURANT_OWNER','BRANCH_MANAGER','STAFF','KITCHEN_STAFF')")
public class QrActivityController {

    private final QrActivityService qrActivityService;

    public QrActivityController(QrActivityService qrActivityService) {
        this.qrActivityService = qrActivityService;
    }

    @Operation(summary = "Live 'ordering now' + today's orders per QR for a branch")
    @GetMapping("/api/dashboard/qr-activity")
    public ApiResponse<QrActivityResponse> get(@RequestParam(required = false) Long branchId) {
        return ApiResponse.ok(qrActivityService.forBranch(branchId));
    }

    @Operation(summary = "Realtime QR activity stream (SSE) — pushes a snapshot on every change")
    @GetMapping(value = "/api/dashboard/qr-activity/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@RequestParam(required = false) Long branchId) {
        return qrActivityService.streamForDashboard(branchId);
    }
}
