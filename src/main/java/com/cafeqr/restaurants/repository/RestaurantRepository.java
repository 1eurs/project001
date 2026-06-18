package com.cafeqr.restaurants.repository;

import com.cafeqr.restaurants.domain.Restaurant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

    Optional<Restaurant> findBySlug(String slug);

    boolean existsBySlug(String slug);

    Page<Restaurant> findByActive(boolean active, Pageable pageable);

    /** Active restaurants on the given plan — used by the weekly insights job. */
    List<Restaurant> findByPlanAndActiveTrue(com.cafeqr.restaurants.domain.Plan plan);
}
