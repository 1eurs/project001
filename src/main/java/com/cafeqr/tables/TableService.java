package com.cafeqr.tables;

import com.cafeqr.auth.security.AccessGuard;
import com.cafeqr.branches.BranchService;
import com.cafeqr.branches.domain.Branch;
import com.cafeqr.common.config.AppProperties;
import com.cafeqr.common.exception.BadRequestException;
import com.cafeqr.common.exception.ErrorCode;
import com.cafeqr.common.exception.ResourceNotFoundException;
import com.cafeqr.common.util.Tokens;
import com.cafeqr.restaurants.RestaurantService;
import com.cafeqr.restaurants.domain.Restaurant;
import com.cafeqr.tables.domain.RestaurantTable;
import com.cafeqr.tables.dto.CreateTableRequest;
import com.cafeqr.tables.dto.TableResponse;
import com.cafeqr.tables.dto.UpdateTableRequest;
import com.cafeqr.tables.repository.RestaurantTableRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TableService {

    private final RestaurantTableRepository tableRepository;
    private final BranchService branchService;
    private final RestaurantService restaurantService;
    private final AccessGuard accessGuard;
    private final String publicBaseUrl;

    public TableService(RestaurantTableRepository tableRepository,
                        BranchService branchService,
                        RestaurantService restaurantService,
                        AccessGuard accessGuard,
                        AppProperties appProperties) {
        this.tableRepository = tableRepository;
        this.branchService = branchService;
        this.restaurantService = restaurantService;
        this.accessGuard = accessGuard;
        this.publicBaseUrl = appProperties.publicBaseUrl();
    }

    @Transactional
    public TableResponse create(Long branchId, CreateTableRequest request) {
        Branch branch = branchService.getEntity(branchId);
        accessGuard.requireBranchAccess(branch.getRestaurantId(), branch.getId());
        Restaurant restaurant = restaurantService.getEntity(branch.getRestaurantId());

        RestaurantTable table = new RestaurantTable();
        table.setRestaurantId(branch.getRestaurantId());
        table.setBranchId(branchId);
        table.setTableNumber(request.tableNumber());
        assignNewToken(table, restaurant, branch);
        table.setActive(true);
        return TableResponse.from(tableRepository.save(table));
    }

    @Transactional(readOnly = true)
    public List<TableResponse> listByBranch(Long branchId) {
        Branch branch = branchService.getEntity(branchId);
        accessGuard.requireBranchAccess(branch.getRestaurantId(), branch.getId());
        return tableRepository.findByBranchIdOrderByTableNumberAsc(branchId)
                .stream().map(TableResponse::from).toList();
    }

    @Transactional
    public TableResponse update(Long tableId, UpdateTableRequest request) {
        RestaurantTable table = getEntity(tableId);
        accessGuard.requireBranchAccess(table.getRestaurantId(), table.getBranchId());
        if (request.tableNumber() != null) {
            table.setTableNumber(request.tableNumber());
        }
        if (request.active() != null) {
            table.setActive(request.active());
        }
        return TableResponse.from(table);
    }

    @Transactional
    public void delete(Long tableId) {
        RestaurantTable table = getEntity(tableId);
        accessGuard.requireBranchAccess(table.getRestaurantId(), table.getBranchId());
        tableRepository.delete(table);
    }

    @Transactional
    public TableResponse regenerateQr(Long tableId) {
        RestaurantTable table = getEntity(tableId);
        accessGuard.requireBranchAccess(table.getRestaurantId(), table.getBranchId());
        Restaurant restaurant = restaurantService.getEntity(table.getRestaurantId());
        Branch branch = branchService.getEntity(table.getBranchId());
        assignNewToken(table, restaurant, branch);
        return TableResponse.from(table);
    }

    // ---- helpers shared with other modules ----

    @Transactional(readOnly = true)
    public RestaurantTable getEntity(Long tableId) {
        return tableRepository.findById(tableId)
                .orElseThrow(() -> ResourceNotFoundException.of("Table", tableId));
    }

    /** Resolves a table by its public QR token, validating it is active. */
    @Transactional(readOnly = true)
    public RestaurantTable getActiveByToken(String token) {
        RestaurantTable table = tableRepository.findByQrCodeToken(token)
                .orElseThrow(() -> new BadRequestException(ErrorCode.TABLE_INVALID, "Invalid table QR code"));
        if (!table.isActive()) {
            throw new BadRequestException(ErrorCode.TABLE_INVALID, "This table is not active");
        }
        return table;
    }

    private void assignNewToken(RestaurantTable table, Restaurant restaurant, Branch branch) {
        String token = Tokens.random(18);
        table.setQrCodeToken(token);
        table.setQrCodeUrl(buildQrUrl(restaurant.getSlug(), branch.getId(), token));
    }

    private String buildQrUrl(String slug, Long branchId, String token) {
        return publicBaseUrl + "/r/" + slug + "/b/" + branchId + "/t/" + token;
    }
}
