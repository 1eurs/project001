package com.cafeqr.plans.repository;

import com.cafeqr.plans.domain.PricingPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PricingPlanRepository extends JpaRepository<PricingPlan, Long> {

    List<PricingPlan> findAllByOrderByDisplayOrderAscIdAsc();
}
