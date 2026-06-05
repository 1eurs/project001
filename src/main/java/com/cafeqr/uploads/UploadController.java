package com.cafeqr.uploads;

import com.cafeqr.common.api.ApiResponse;
import com.cafeqr.uploads.dto.UploadResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/uploads")
@Tag(name = "Uploads")
@PreAuthorize("hasAnyRole('PLATFORM_ADMIN','RESTAURANT_OWNER','BRANCH_MANAGER')")
public class UploadController {

    private final StorageService storageService;

    public UploadController(StorageService storageService) {
        this.storageService = storageService;
    }

    @Operation(summary = "Upload a menu item image")
    @PostMapping(value = "/menu-items", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<UploadResponse> uploadMenuItemImage(@RequestParam("file") MultipartFile file) {
        return ApiResponse.ok("File uploaded", new UploadResponse(storageService.store(file, "menu-items")));
    }

    @Operation(summary = "Upload a restaurant logo")
    @PostMapping(value = "/restaurants/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<UploadResponse> uploadRestaurantLogo(@RequestParam("file") MultipartFile file) {
        return ApiResponse.ok("File uploaded", new UploadResponse(storageService.store(file, "restaurant-logos")));
    }
}
