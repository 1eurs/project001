package com.cafeqr.customers;

import com.cafeqr.common.api.ApiResponse;
import com.cafeqr.customers.dto.ReturningCustomerResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
@Tag(name = "Public customers")
@Validated
public class PublicCustomerController {

    private final CustomerService customerService;

    public PublicCustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @Operation(summary = "Returning-customer profile, favorites and last order for a device token "
            + "(null data when the device has never ordered here)", security = {})
    @GetMapping("/restaurants/{slug}/returning")
    public ApiResponse<ReturningCustomerResponse> returning(
            @PathVariable String slug,
            @RequestParam @Size(max = 64) String deviceToken) {
        return ApiResponse.ok(customerService.returning(slug, deviceToken));
    }
}
