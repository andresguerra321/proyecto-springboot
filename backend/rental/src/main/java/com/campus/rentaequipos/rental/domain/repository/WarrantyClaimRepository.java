package com.campus.rentaequipos.rental.domain.repository;

import com.campus.rentaequipos.rental.domain.model.WarrantyClaim;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WarrantyClaimRepository {
    Optional<WarrantyClaim> findById(UUID id);
    Optional<WarrantyClaim> findByTicketNumber(String ticketNumber);
    List<WarrantyClaim> findByRentalId(UUID rentalId);
    List<WarrantyClaim> findByProviderId(UUID providerId);
    List<WarrantyClaim> findAll();
    WarrantyClaim save(WarrantyClaim claim);
}
