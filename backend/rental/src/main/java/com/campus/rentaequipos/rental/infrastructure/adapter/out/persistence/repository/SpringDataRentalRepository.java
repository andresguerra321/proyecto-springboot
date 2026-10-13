package com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence.repository;

import com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence.entity.RentalJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SpringDataRentalRepository extends JpaRepository<RentalJpaEntity, UUID> {
    Optional<RentalJpaEntity> findByRentalCode(String rentalCode);
    List<RentalJpaEntity> findByClientId(UUID clientId);
}
