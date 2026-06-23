package com.cafeqr.leads;

import com.cafeqr.common.api.ApiResponse;
import com.cafeqr.leads.dto.CreateLeadRequest;
import com.cafeqr.leads.dto.LeadResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Tag(name = "Leads")
public class LeadController {

    private final LeadService leadService;

    public LeadController(LeadService leadService) {
        this.leadService = leadService;
    }

    @Operation(summary = "Submit a café access / demo request (public)")
    @PostMapping("/api/public/leads")
    public ApiResponse<LeadResponse> submit(@Valid @RequestBody CreateLeadRequest request) {
        return ApiResponse.ok("Request received", leadService.create(request));
    }

    @Operation(summary = "List café access requests (platform admin)")
    @PreAuthorize("hasAuthority('PLATFORM_ADMIN')")
    @GetMapping("/api/admin/leads")
    public ApiResponse<List<LeadResponse>> list() {
        return ApiResponse.ok(leadService.list());
    }
}
