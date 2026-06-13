package com.cafeqr.customers;

import com.cafeqr.common.api.ApiResponse;
import com.cafeqr.customers.dto.BlockPhoneRequest;
import com.cafeqr.customers.dto.BlockedPhoneResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard/blocked-phones")
@Tag(name = "Blocked phones")
@PreAuthorize("hasAnyRole('RESTAURANT_OWNER','BRANCH_MANAGER')")
public class BlockedPhoneController {

    private final CustomerService customerService;

    public BlockedPhoneController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @Operation(summary = "List blocked phone numbers")
    @GetMapping
    public ApiResponse<List<BlockedPhoneResponse>> list(@RequestParam(required = false) Long restaurantId) {
        return ApiResponse.ok(customerService.listBlocked(restaurantId));
    }

    @Operation(summary = "Block a phone number from placing orders (fake orders / spam)")
    @PostMapping
    public ApiResponse<BlockedPhoneResponse> block(@RequestParam(required = false) Long restaurantId,
                                                   @Valid @RequestBody BlockPhoneRequest request) {
        return ApiResponse.ok("Phone number blocked",
                customerService.block(restaurantId, request.phone(), request.reason()));
    }

    @Operation(summary = "Unblock a phone number")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> unblock(@PathVariable Long id) {
        customerService.unblock(id);
        return ApiResponse.message("Phone number unblocked");
    }
}
