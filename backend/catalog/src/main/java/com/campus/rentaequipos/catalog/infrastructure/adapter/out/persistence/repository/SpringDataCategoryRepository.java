package com.campus.rentaequipos.catalog.infrastructure.adapter.out.persistence.repository;

import com.campus.rentaequipos.catalog.infrastructure.adapter.out.persistence.entity.CategoryJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface SpringDataCategoryRepository extends JpaRepository<CategoryJpaEntity, UUID> {
}
