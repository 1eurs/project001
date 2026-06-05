package com.cafeqr.menus.repository;

import com.cafeqr.menus.domain.MenuCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MenuCategoryRepository extends JpaRepository<MenuCategory, Long> {

    List<MenuCategory> findByRestaurantIdOrderByDisplayOrderAscIdAsc(Long restaurantId);

    @Query("""
            SELECT c FROM MenuCategory c
            WHERE c.restaurantId = :restaurantId AND c.branchId IS NULL AND c.active = true
            ORDER BY c.displayOrder ASC, c.id ASC
            """)
    List<MenuCategory> findActiveRestaurantWide(@Param("restaurantId") Long restaurantId);

    @Query("""
            SELECT c FROM MenuCategory c
            WHERE c.restaurantId = :restaurantId
              AND (c.branchId IS NULL OR c.branchId = :branchId)
              AND c.active = true
            ORDER BY c.displayOrder ASC, c.id ASC
            """)
    List<MenuCategory> findActiveForBranch(@Param("restaurantId") Long restaurantId,
                                           @Param("branchId") Long branchId);
}
