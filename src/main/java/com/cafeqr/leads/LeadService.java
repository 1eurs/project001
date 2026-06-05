package com.cafeqr.leads;

import com.cafeqr.leads.domain.Lead;
import com.cafeqr.leads.domain.LeadStatus;
import com.cafeqr.leads.dto.CreateLeadRequest;
import com.cafeqr.leads.dto.LeadResponse;
import com.cafeqr.leads.repository.LeadRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class LeadService {

    private final LeadRepository leadRepository;

    public LeadService(LeadRepository leadRepository) {
        this.leadRepository = leadRepository;
    }

    @Transactional
    public LeadResponse create(CreateLeadRequest request) {
        Lead lead = new Lead();
        lead.setCafeName(request.cafeName());
        lead.setContactName(request.contactName());
        lead.setPhone(request.phone());
        lead.setEmail(request.email());
        lead.setCity(request.city());
        lead.setNote(request.note());
        lead.setStatus(LeadStatus.NEW);
        return LeadResponse.from(leadRepository.save(lead));
    }

    @Transactional(readOnly = true)
    public List<LeadResponse> list() {
        return leadRepository.findAllByOrderByCreatedAtDesc().stream().map(LeadResponse::from).toList();
    }
}
