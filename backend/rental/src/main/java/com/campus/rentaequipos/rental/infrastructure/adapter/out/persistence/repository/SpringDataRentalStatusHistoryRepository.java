package com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence.repository;

import com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence.entity.RentalStatusHistoryJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SpringDataRentalStatusHistoryRepository extends JpaRepository<RentalStatusHistoryJpaEntity, UUID> {
    List<RentalStatusHistoryJpaEntity> findByRentalIdOrderByChangedAtAsc(UUID rentalId);
}
