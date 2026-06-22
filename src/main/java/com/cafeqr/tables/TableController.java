package com.cafeqr.tables;

import com.cafeqr.common.api.ApiResponse;
import com.cafeqr.tables.dto.CreateTableRequest;
import com.cafeqr.tables.dto.TableResponse;
import com.cafeqr.tables.dto.UpdateTableRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Tag(name = "Tables / QR")
@PreAuthorize("hasAuthority('QR_TABLES')")
public class TableController {

    private final TableService tableService;

    public TableController(TableService tableService) {
        this.tableService = tableService;
    }

    @Operation(summary = "Create a table (auto-generates a QR token)")
    @PostMapping("/api/branches/{branchId}/tables")
    public ApiResponse<TableResponse> create(@PathVariable Long branchId,
                                             @Valid @RequestBody CreateTableRequest request) {
        return ApiResponse.ok("Table created", tableService.create(branchId, request));
    }

    @Operation(summary = "List tables of a branch")
    @GetMapping("/api/branches/{branchId}/tables")
    public ApiResponse<List<TableResponse>> list(@PathVariable Long branchId) {
        return ApiResponse.ok(tableService.listByBranch(branchId));
    }

    @Operation(summary = "Update a table")
    @PatchMapping("/api/tables/{tableId}")
    public ApiResponse<TableResponse> update(@PathVariable Long tableId,
                                             @Valid @RequestBody UpdateTableRequest request) {
        return ApiResponse.ok("Table updated", tableService.update(tableId, request));
    }

    @Operation(summary = "Delete a table")
    @DeleteMapping("/api/tables/{tableId}")
    public ApiResponse<Void> delete(@PathVariable Long tableId) {
        tableService.delete(tableId);
        return ApiResponse.message("Table deleted");
    }

    @Operation(summary = "Regenerate a table's QR token")
    @PostMapping("/api/tables/{tableId}/regenerate-qr")
    public ApiResponse<TableResponse> regenerate(@PathVariable Long tableId) {
        return ApiResponse.ok("QR regenerated", tableService.regenerateQr(tableId));
    }
}
