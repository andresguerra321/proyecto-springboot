package com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence.repository;

import com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence.entity.RentalInspectionJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SpringDataRentalInspectionRepository extends JpaRepository<RentalInspectionJpaEntity, UUID> {
    List<RentalInspectionJpaEntity> findByRentalId(UUID rentalId);
}
