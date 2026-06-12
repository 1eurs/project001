package com.cafeqr.branches;

import com.cafeqr.auth.security.AccessGuard;
import com.cafeqr.branches.domain.Branch;
import com.cafeqr.branches.dto.BranchResponse;
import com.cafeqr.branches.dto.CreateBranchRequest;
import com.cafeqr.branches.dto.UpdateBranchRequest;
import com.cafeqr.branches.repository.BranchRepository;
import com.cafeqr.common.exception.BadRequestException;
import com.cafeqr.common.exception.ErrorCode;
import com.cafeqr.common.exception.ResourceNotFoundException;
import com.cafeqr.restaurants.RestaurantService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BranchService {

    private final BranchRepository branchRepository;
    private final RestaurantService restaurantService;
    private final AccessGuard accessGuard;

    public BranchService(BranchRepository branchRepository,
                         RestaurantService restaurantService,
                         AccessGuard accessGuard) {
        this.branchRepository = branchRepository;
        this.restaurantService = restaurantService;
        this.accessGuard = accessGuard;
    }

    @Transactional
    public BranchResponse create(Long restaurantId, CreateBranchRequest request) {
        accessGuard.requireRestaurantAccess(restaurantId);
        restaurantService.getEntity(restaurantId); // ensure exists

        Branch branch = new Branch();
        branch.setRestaurantId(restaurantId);
        branch.setName(request.name());
        branch.setAddress(request.address());
        branch.setPhone(request.phone());
        branch.setOpeningHours(request.openingHours());
        branch.setActive(true);
        return BranchResponse.from(branchRepository.save(branch));
    }

    /**
     * Creates a café's first branch during self-serve onboarding. Skips the access-guard
     * check because onboarding runs unauthenticated (no principal yet) — callers must only
     * pass a {@code restaurantId} they just created themselves.
     */
    @Transactional
    public BranchResponse createDefault(Long restaurantId, String name) {
        Branch branch = new Branch();
        branch.setRestaurantId(restaurantId);
        branch.setName(name);
        branch.setActive(true);
        return BranchResponse.from(branchRepository.save(branch));
    }

    /**
     * Guarantees the restaurant has at least one branch (idempotent). Used to heal cafés that
     * were onboarded before branches were auto-created, so the dashboard's Tables &amp; QR page
     * — which needs a branch — is never dead for them.
     */
    @Transactional
    public void ensureDefaultBranch(Long restaurantId, String name) {
        if (branchRepository.findByRestaurantIdOrderByNameAsc(restaurantId).isEmpty()) {
            createDefault(restaurantId, name);
        }
    }

    @Transactional(readOnly = true)
    public List<BranchResponse> listByRestaurant(Long restaurantId) {
        accessGuard.requireRestaurantAccess(restaurantId);
        return branchRepository.findByRestaurantIdOrderByNameAsc(restaurantId)
                .stream().map(BranchResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public BranchResponse get(Long branchId) {
        Branch branch = getEntity(branchId);
        accessGuard.requireBranchAccess(branch.getRestaurantId(), branch.getId());
        return BranchResponse.from(branch);
    }

    @Transactional
    public BranchResponse update(Long branchId, UpdateBranchRequest request) {
        Branch branch = getEntity(branchId);
        accessGuard.requireBranchAccess(branch.getRestaurantId(), branch.getId());
        if (request.name() != null) {
            branch.setName(request.name());
        }
        if (request.address() != null) {
            branch.setAddress(request.address());
        }
        if (request.phone() != null) {
            branch.setPhone(request.phone());
        }
        if (request.openingHours() != null) {
            branch.setOpeningHours(request.openingHours());
        }
        return BranchResponse.from(branch);
    }

    @Transactional
    public BranchResponse setActive(Long branchId, boolean active) {
        Branch branch = getEntity(branchId);
        accessGuard.requireBranchAccess(branch.getRestaurantId(), branch.getId());
        branch.setActive(active);
        return BranchResponse.from(branch);
    }

    // ---- helpers shared with other modules ----

    @Transactional(readOnly = true)
    public Branch getEntity(Long branchId) {
        return branchRepository.findById(branchId)
                .orElseThrow(() -> ResourceNotFoundException.of("Branch", branchId));
    }

    /** Loads a branch and validates it belongs to the given restaurant. */
    @Transactional(readOnly = true)
    public Branch getEntityInRestaurant(Long restaurantId, Long branchId) {
        Branch branch = getEntity(branchId);
        if (!branch.getRestaurantId().equals(restaurantId)) {
            throw new ResourceNotFoundException("Branch " + branchId + " not found in restaurant " + restaurantId);
        }
        return branch;
    }

    public void requireActive(Branch branch) {
        if (!branch.isActive()) {
            throw new BadRequestException(ErrorCode.BRANCH_INACTIVE, "Branch is not active");
        }
    }
}
