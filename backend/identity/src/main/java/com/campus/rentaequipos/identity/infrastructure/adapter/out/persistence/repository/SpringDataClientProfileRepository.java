package com.campus.rentaequipos.identity.infrastructure.adapter.out.persistence.repository;

import com.campus.rentaequipos.identity.infrastructure.adapter.out.persistence.entity.ClientProfileJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SpringDataClientProfileRepository extends JpaRepository<ClientProfileJpaEntity, UUID> {
    Optional<ClientProfileJpaEntity> findByUserId(UUID userId);
    boolean existsByDocumentNumber(String documentNumber);
}
