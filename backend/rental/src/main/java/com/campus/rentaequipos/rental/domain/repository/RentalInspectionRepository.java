package com.campus.rentaequipos.rental.domain.repository;

import com.campus.rentaequipos.rental.domain.model.RentalInspection;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RentalInspectionRepository {
    Optional<RentalInspection> findById(UUID id);
    List<RentalInspection> findByRentalId(UUID rentalId);
    RentalInspection save(RentalInspection inspection);
}
