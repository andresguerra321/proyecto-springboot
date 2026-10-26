package com.campus.rentaequipos.rental.domain.repository;

import com.campus.rentaequipos.rental.domain.model.RentalStatusHistory;

import java.util.List;
import java.util.UUID;

public interface RentalStatusHistoryRepository {
    RentalStatusHistory save(RentalStatusHistory history);
    List<RentalStatusHistory> findByRentalId(UUID rentalId);
}
