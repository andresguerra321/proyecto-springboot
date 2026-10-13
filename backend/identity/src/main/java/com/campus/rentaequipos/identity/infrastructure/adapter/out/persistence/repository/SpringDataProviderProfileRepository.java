package com.campus.rentaequipos.identity.infrastructure.adapter.out.persistence.repository;

import com.campus.rentaequipos.identity.infrastructure.adapter.out.persistence.entity.ProviderProfileJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SpringDataProviderProfileRepository extends JpaRepository<ProviderProfileJpaEntity, UUID> {
    Optional<ProviderProfileJpaEntity> findByUserId(UUID userId);
}
