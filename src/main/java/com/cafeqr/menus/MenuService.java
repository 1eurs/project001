package com.cafeqr.menus;

import com.cafeqr.auth.security.AccessGuard;
import com.cafeqr.auth.security.CustomUserDetails;
import com.cafeqr.auth.security.SecurityUtils;
import com.cafeqr.branches.BranchService;
import com.cafeqr.common.exception.BadRequestException;
import com.cafeqr.common.exception.ErrorCode;
import com.cafeqr.common.exception.ResourceNotFoundException;
import com.cafeqr.menus.domain.MenuCategory;
import com.cafeqr.menus.domain.MenuItem;
import com.cafeqr.menus.dto.CategoryResponse;
import com.cafeqr.menus.dto.CreateCategoryRequest;
import com.cafeqr.menus.dto.CreateMenuItemRequest;
import com.cafeqr.menus.dto.MenuItemResponse;
import com.cafeqr.menus.dto.UpdateCategoryRequest;
import com.cafeqr.menus.dto.UpdateMenuItemRequest;
import com.cafeqr.menus.repository.MenuCategoryRepository;
import com.cafeqr.menus.repository.MenuItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Menu management (dashboard) plus the order-time item validation helper. */
@Service
public class MenuService {

    private final MenuCategoryRepository categoryRepository;
    private final MenuItemRepository itemRepository;
    private final BranchService branchService;
    private final AccessGuard accessGuard;

    public MenuService(MenuCategoryRepository categoryRepository,
                       MenuItemRepository itemRepository,
                       BranchService branchService,
                       AccessGuard accessGuard) {
        this.categoryRepository = categoryRepository;
        this.itemRepository = itemRepository;
        this.branchService = branchService;
        this.accessGuard = accessGuard;
    }

    // ----------------------------------------------------------------- categories

    @Transactional
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        Long restaurantId = resolveRestaurantId(request.restaurantId());
        accessGuard.requireRestaurantAccess(restaurantId);
        Long branchId = resolveBranchId(restaurantId, request.branchId());

        MenuCategory category = new MenuCategory();
        category.setRestaurantId(restaurantId);
        category.setBranchId(branchId);
        category.setNameEn(request.nameEn());
        category.setNameAr(request.nameAr());
        category.setDescriptionEn(request.descriptionEn());
        category.setDescriptionAr(request.descriptionAr());
        category.setDisplayOrder(request.displayOrder() != null ? request.displayOrder() : 0);
        category.setActive(request.active() == null || request.active());
        return CategoryResponse.from(categoryRepository.save(category));
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> listCategories(Long restaurantId, Long branchId) {
        Long scopedRestaurant = resolveRestaurantId(restaurantId);
        accessGuard.requireRestaurantAccess(scopedRestaurant);
        List<MenuCategory> categories = categoryRepository
                .findByRestaurantIdOrderByDisplayOrderAscIdAsc(scopedRestaurant);
        Long branchScope = (branchId != null) ? branchId : accessGuard.scopedBranchId();
        return categories.stream()
                .filter(c -> branchScope == null || c.getBranchId() == null || c.getBranchId().equals(branchScope))
                .map(CategoryResponse::from)
                .toList();
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, UpdateCategoryRequest request) {
        MenuCategory category = getCategoryEntity(id);
        accessGuard.requireBranchAccess(category.getRestaurantId(), category.getBranchId());
        if (request.nameEn() != null) {
            category.setNameEn(request.nameEn());
        }
        if (request.nameAr() != null) {
            category.setNameAr(request.nameAr());
        }
        if (request.descriptionEn() != null) {
            category.setDescriptionEn(request.descriptionEn());
        }
        if (request.descriptionAr() != null) {
            category.setDescriptionAr(request.descriptionAr());
        }
        if (request.displayOrder() != null) {
            category.setDisplayOrder(request.displayOrder());
        }
        if (request.active() != null) {
            category.setActive(request.active());
        }
        return CategoryResponse.from(category);
    }

    @Transactional
    public void deleteCategory(Long id) {
        MenuCategory category = getCategoryEntity(id);
        accessGuard.requireBranchAccess(category.getRestaurantId(), category.getBranchId());
        if (!itemRepository.findByCategoryIdOrderByDisplayOrderAscIdAsc(id).isEmpty()) {
            throw new BadRequestException("Cannot delete a category that still has menu items");
        }
        categoryRepository.delete(category);
    }

    // ----------------------------------------------------------------- items

    @Transactional
    public MenuItemResponse createItem(CreateMenuItemRequest request) {
        Long restaurantId = resolveRestaurantId(request.restaurantId());
        accessGuard.requireRestaurantAccess(restaurantId);
        Long branchId = resolveBranchId(restaurantId, request.branchId());

        MenuCategory category = getCategoryEntity(request.categoryId());
        if (!category.getRestaurantId().equals(restaurantId)) {
            throw new BadRequestException("Category does not belong to this restaurant");
        }

        MenuItem item = new MenuItem();
        item.setRestaurantId(restaurantId);
        item.setBranchId(branchId);
        item.setCategoryId(category.getId());
        item.setNameEn(request.nameEn());
        item.setNameAr(request.nameAr());
        item.setDescriptionEn(request.descriptionEn());
        item.setDescriptionAr(request.descriptionAr());
        item.setPrice(request.price());
        item.setImageUrl(request.imageUrl());
        item.setAvailable(request.available() == null || request.available());
        item.setPreparationTimeMinutes(request.preparationTimeMinutes());
        item.setDisplayOrder(request.displayOrder() != null ? request.displayOrder() : 0);
        return MenuItemResponse.from(itemRepository.save(item));
    }

    @Transactional(readOnly = true)
    public List<MenuItemResponse> listItems(Long restaurantId, Long branchId, Long categoryId) {
        if (categoryId != null) {
            MenuCategory category = getCategoryEntity(categoryId);
            accessGuard.requireRestaurantAccess(category.getRestaurantId());
            return itemRepository.findByCategoryIdOrderByDisplayOrderAscIdAsc(categoryId)
                    .stream().map(MenuItemResponse::from).toList();
        }
        Long scopedRestaurant = resolveRestaurantId(restaurantId);
        accessGuard.requireRestaurantAccess(scopedRestaurant);
        Long branchScope = (branchId != null) ? branchId : accessGuard.scopedBranchId();
        return itemRepository.findByRestaurantIdOrderByDisplayOrderAscIdAsc(scopedRestaurant).stream()
                .filter(i -> branchScope == null || i.getBranchId() == null || i.getBranchId().equals(branchScope))
                .map(MenuItemResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public MenuItemResponse getItem(Long id) {
        MenuItem item = getItemEntity(id);
        accessGuard.requireRestaurantAccess(item.getRestaurantId());
        return MenuItemResponse.from(item);
    }

    @Transactional
    public MenuItemResponse updateItem(Long id, UpdateMenuItemRequest request) {
        MenuItem item = getItemEntity(id);
        accessGuard.requireBranchAccess(item.getRestaurantId(), item.getBranchId());
        if (request.categoryId() != null) {
            MenuCategory category = getCategoryEntity(request.categoryId());
            if (!category.getRestaurantId().equals(item.getRestaurantId())) {
                throw new BadRequestException("Category does not belong to this restaurant");
            }
            item.setCategoryId(category.getId());
        }
        if (request.nameEn() != null) {
            item.setNameEn(request.nameEn());
        }
        if (request.nameAr() != null) {
            item.setNameAr(request.nameAr());
        }
        if (request.descriptionEn() != null) {
            item.setDescriptionEn(request.descriptionEn());
        }
        if (request.descriptionAr() != null) {
            item.setDescriptionAr(request.descriptionAr());
        }
        if (request.price() != null) {
            item.setPrice(request.price());
        }
        if (request.imageUrl() != null) {
            item.setImageUrl(request.imageUrl());
        }
        if (request.available() != null) {
            item.setAvailable(request.available());
        }
        if (request.preparationTimeMinutes() != null) {
            item.setPreparationTimeMinutes(request.preparationTimeMinutes());
        }
        if (request.displayOrder() != null) {
            item.setDisplayOrder(request.displayOrder());
        }
        return MenuItemResponse.from(item);
    }

    @Transactional
    public MenuItemResponse updateAvailability(Long id, boolean available) {
        MenuItem item = getItemEntity(id);
        accessGuard.requireBranchAccess(item.getRestaurantId(), item.getBranchId());
        item.setAvailable(available);
        return MenuItemResponse.from(item);
    }

    @Transactional
    public void deleteItem(Long id) {
        MenuItem item = getItemEntity(id);
        accessGuard.requireBranchAccess(item.getRestaurantId(), item.getBranchId());
        itemRepository.delete(item);
    }

    // ----------------------------------------------------------------- order-time helper

    /**
     * Resolves a menu item for an incoming public order, validating restaurant/branch scope
     * and availability. No authentication context is required.
     */
    @Transactional(readOnly = true)
    public MenuItem getOrderableItem(Long restaurantId, Long branchId, Long itemId) {
        MenuItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new BadRequestException(ErrorCode.MENU_ITEM_UNAVAILABLE,
                        "Menu item not found: " + itemId));
        if (!item.getRestaurantId().equals(restaurantId)
                || (item.getBranchId() != null && !item.getBranchId().equals(branchId))) {
            throw new BadRequestException(ErrorCode.MENU_ITEM_UNAVAILABLE,
                    "Menu item is not available at this branch");
        }
        if (!item.isAvailable()) {
            throw new BadRequestException(ErrorCode.MENU_ITEM_UNAVAILABLE,
                    "Menu item \"" + item.getNameEn() + "\" is not available");
        }
        return item;
    }

    // ----------------------------------------------------------------- internals

    private MenuCategory getCategoryEntity(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Category", id));
    }

    private MenuItem getItemEntity(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Menu item", id));
    }

    private Long resolveRestaurantId(Long requested) {
        CustomUserDetails user = SecurityUtils.currentUser();
        if (user.isPlatformAdmin()) {
            if (requested == null) {
                throw new BadRequestException("restaurantId is required for platform admin");
            }
            return requested;
        }
        if (user.getRestaurantId() == null) {
            throw new BadRequestException("Your account is not associated with a restaurant");
        }
        return user.getRestaurantId();
    }

    private Long resolveBranchId(Long restaurantId, Long requestedBranchId) {
        Long scopedBranch = accessGuard.scopedBranchId();
        if (scopedBranch != null) {
            return scopedBranch; // branch-scoped users may only manage their own branch
        }
        if (requestedBranchId != null) {
            branchService.getEntityInRestaurant(restaurantId, requestedBranchId);
        }
        return requestedBranchId;
    }
}
