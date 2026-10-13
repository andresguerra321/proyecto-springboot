package com.campus.rentaequipos.rental.domain.repository;

import com.campus.rentaequipos.rental.domain.model.Rental;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RentalRepository {
    Optional<Rental> findById(UUID id);
    Optional<Rental> findByRentalCode(String rentalCode);
    List<Rental> findByClientId(UUID clientId);
    List<Rental> findAll();
    Rental save(Rental rental);
}
