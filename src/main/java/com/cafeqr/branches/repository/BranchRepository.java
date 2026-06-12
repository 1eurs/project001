package com.cafeqr.branches.repository;

import com.cafeqr.branches.domain.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface BranchRepository extends JpaRepository<Branch, Long> {

    List<Branch> findByRestaurantIdOrderByNameAsc(Long restaurantId);

    List<Branch> findByRestaurantIdAndActiveTrueOrderByNameAsc(Long restaurantId);

    /** {@code [restaurantId, branchCount]} for the platform admin console. */
    @Query("SELECT b.restaurantId, COUNT(b) FROM Branch b GROUP BY b.restaurantId")
    List<Object[]> countPerRestaurant();
}
