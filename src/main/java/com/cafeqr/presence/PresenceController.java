package com.cafeqr.presence;

import com.cafeqr.common.api.ApiResponse;
import com.cafeqr.presence.dto.PresenceHeartbeatRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Presence")
public class PresenceController {

    private final PresenceService presenceService;

    public PresenceController(PresenceService presenceService) {
        this.presenceService = presenceService;
    }

    @Operation(summary = "Heartbeat that a customer is on a QR's menu (or leave) — public", security = {})
    @PostMapping("/api/public/presence")
    public ApiResponse<Void> heartbeat(@Valid @RequestBody PresenceHeartbeatRequest request) {
        if ("leave".equalsIgnoreCase(request.stage())) {
            presenceService.remove(request.branchId(), request.qrKey(), request.sessionId());
        } else {
            boolean ordering = "ordering".equalsIgnoreCase(request.stage());
            presenceService.heartbeat(request.branchId(), request.qrKey(), request.sessionId(), ordering);
        }
        return ApiResponse.message("ok");
    }
}
