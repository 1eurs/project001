package com.cafeqr.plans;

import com.cafeqr.common.exception.ResourceNotFoundException;
import com.cafeqr.plans.domain.PricingPlan;
import com.cafeqr.plans.dto.PricingPlanResponse;
import com.cafeqr.plans.dto.UpdatePlanRequest;
import com.cafeqr.plans.repository.PricingPlanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PricingPlanService {

    private final PricingPlanRepository planRepository;

    public PricingPlanService(PricingPlanRepository planRepository) {
        this.planRepository = planRepository;
    }

    @Transactional(readOnly = true)
    public List<PricingPlanResponse> list() {
        return planRepository.findAllByOrderByDisplayOrderAscIdAsc().stream()
                .map(PricingPlanResponse::from)
                .toList();
    }

    /**
     * Edit a tier's pricing. The tier identity itself is fixed — only the name,
     * money fields, and visibility can change. A null monthlyPrice means "custom".
     */
    @Transactional
    public PricingPlanResponse update(Long id, UpdatePlanRequest request) {
        PricingPlan plan = planRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Plan", id));
        if (request.name() != null) {
            plan.setName(request.name().trim());
        }
        if (request.clearMonthlyPrice()) {
            plan.setMonthlyPrice(null);
        } else if (request.monthlyPrice() != null) {
            plan.setMonthlyPrice(request.monthlyPrice());
        }
        if (request.setupFee() != null) {
            plan.setSetupFee(request.setupFee());
        }
        if (request.active() != null) {
            plan.setActive(request.active());
        }
        if (request.displayOrder() != null) {
            plan.setDisplayOrder(request.displayOrder());
        }
        return PricingPlanResponse.from(plan);
    }
}
