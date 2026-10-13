package com.campus.rentaequipos.catalog.infrastructure.adapter.out.persistence.repository;

import com.campus.rentaequipos.catalog.infrastructure.adapter.out.persistence.entity.ToolJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SpringDataToolRepository extends JpaRepository<ToolJpaEntity, UUID> {
    List<ToolJpaEntity> findByCategory_Id(UUID categoryId);
    List<ToolJpaEntity> findByProviderId(UUID providerId);
}
