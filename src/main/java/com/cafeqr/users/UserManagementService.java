package com.cafeqr.users;

import com.cafeqr.auth.dto.UserResponse;
import com.cafeqr.auth.security.AccessGuard;
import com.cafeqr.auth.security.CustomUserDetails;
import com.cafeqr.auth.security.SecurityUtils;
import com.cafeqr.branches.BranchService;
import com.cafeqr.branches.domain.Branch;
import com.cafeqr.common.exception.BadRequestException;
import com.cafeqr.common.exception.ConflictException;
import com.cafeqr.common.exception.ErrorCode;
import com.cafeqr.common.exception.ForbiddenException;
import com.cafeqr.common.exception.ResourceNotFoundException;
import com.cafeqr.restaurants.RestaurantService;
import com.cafeqr.users.domain.Role;
import com.cafeqr.users.domain.User;
import com.cafeqr.users.dto.CreateUserRequest;
import com.cafeqr.users.dto.UpdateUserRequest;
import com.cafeqr.users.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

/** Creation and management of staff accounts, enforcing the role hierarchy and tenant scoping. */
@Service
public class UserManagementService {

    private static final Set<Role> BRANCH_ROLES =
            EnumSet.of(Role.BRANCH_MANAGER, Role.STAFF, Role.KITCHEN_STAFF);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RestaurantService restaurantService;
    private final BranchService branchService;
    private final AccessGuard accessGuard;

    public UserManagementService(UserRepository userRepository,
                                 PasswordEncoder passwordEncoder,
                                 RestaurantService restaurantService,
                                 BranchService branchService,
                                 AccessGuard accessGuard) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.restaurantService = restaurantService;
        this.branchService = branchService;
        this.accessGuard = accessGuard;
    }

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        CustomUserDetails creator = SecurityUtils.currentUser();
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException(ErrorCode.EMAIL_ALREADY_EXISTS, "Email is already registered");
        }

        Target target = resolveTarget(creator, request);

        User user = new User();
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setPhone(request.phone());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        user.setRestaurantId(target.restaurantId());
        user.setBranchId(target.branchId());
        user.setActive(true);
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<UserResponse> list(Long restaurantId, Long branchId) {
        CustomUserDetails creator = SecurityUtils.currentUser();
        if (creator.isPlatformAdmin()) {
            List<User> users = (restaurantId != null)
                    ? userRepository.findByRestaurantIdOrderByIdAsc(restaurantId)
                    : userRepository.findAll();
            return users.stream().map(UserResponse::from).toList();
        }
        Long branchScope = accessGuard.scopedBranchId();
        if (branchScope != null) {
            return userRepository.findByBranchIdOrderByIdAsc(branchScope)
                    .stream().map(UserResponse::from).toList();
        }
        return userRepository.findByRestaurantIdOrderByIdAsc(creator.getRestaurantId())
                .stream().map(UserResponse::from).toList();
    }

    @Transactional
    public UserResponse update(Long userId, UpdateUserRequest request) {
        User user = guardedTarget(userId);
        if (request.fullName() != null) {
            user.setFullName(request.fullName());
        }
        if (request.phone() != null) {
            user.setPhone(request.phone());
        }
        if (request.password() != null) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse setActive(Long userId, boolean active) {
        User user = guardedTarget(userId);
        user.setActive(active);
        return UserResponse.from(user);
    }

    // ----------------------------------------------------------------- internals

    private User guardedTarget(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("User", userId));
        if (user.getRole() == Role.PLATFORM_ADMIN) {
            // Only another platform admin may manage platform admins.
            if (!SecurityUtils.currentUser().isPlatformAdmin()) {
                throw new ForbiddenException("You cannot manage this user");
            }
            return user;
        }
        if (user.getBranchId() != null) {
            accessGuard.requireBranchAccess(user.getRestaurantId(), user.getBranchId());
        } else {
            accessGuard.requireRestaurantAccess(user.getRestaurantId());
        }
        return user;
    }

    private Target resolveTarget(CustomUserDetails creator, CreateUserRequest request) {
        Role role = request.role();
        return switch (creator.getRole()) {
            case PLATFORM_ADMIN -> resolveForAdmin(role, request);
            case RESTAURANT_OWNER -> resolveForOwner(creator, role, request);
            case BRANCH_MANAGER -> resolveForManager(creator, role);
            default -> throw new ForbiddenException("You are not allowed to create users");
        };
    }

    private Target resolveForAdmin(Role role, CreateUserRequest request) {
        if (role == Role.PLATFORM_ADMIN) {
            return new Target(null, null);
        }
        if (request.restaurantId() == null) {
            throw new BadRequestException("restaurantId is required for this role");
        }
        restaurantService.getEntity(request.restaurantId());
        if (role == Role.RESTAURANT_OWNER) {
            return new Target(request.restaurantId(), null);
        }
        // branch-level role
        Branch branch = requireBranchInRestaurant(request.restaurantId(), request.branchId());
        return new Target(branch.getRestaurantId(), branch.getId());
    }

    private Target resolveForOwner(CustomUserDetails creator, Role role, CreateUserRequest request) {
        if (!BRANCH_ROLES.contains(role)) {
            throw new ForbiddenException("Owners may only create branch managers and staff");
        }
        Branch branch = requireBranchInRestaurant(creator.getRestaurantId(), request.branchId());
        return new Target(creator.getRestaurantId(), branch.getId());
    }

    private Target resolveForManager(CustomUserDetails creator, Role role) {
        if (role != Role.STAFF && role != Role.KITCHEN_STAFF) {
            throw new ForbiddenException("Branch managers may only create staff and kitchen staff");
        }
        return new Target(creator.getRestaurantId(), creator.getBranchId());
    }

    private Branch requireBranchInRestaurant(Long restaurantId, Long branchId) {
        if (branchId == null) {
            throw new BadRequestException("branchId is required for branch-level roles");
        }
        return branchService.getEntityInRestaurant(restaurantId, branchId);
    }

    private record Target(Long restaurantId, Long branchId) {}
}
