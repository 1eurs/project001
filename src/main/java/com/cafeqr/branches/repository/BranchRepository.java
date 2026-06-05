package com.cafeqr.branches.repository;

import com.cafeqr.branches.domain.Branch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BranchRepository extends JpaRepository<Branch, Long> {

    List<Branch> findByRestaurantIdOrderByNameAsc(Long restaurantId);

    List<Branch> findByRestaurantIdAndActiveTrueOrderByNameAsc(Long restaurantId);
}
