package com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence.repository;

import com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence.entity.DamageReportJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SpringDataDamageReportRepository extends JpaRepository<DamageReportJpaEntity, UUID> {
    List<DamageReportJpaEntity> findByInspectionId(UUID inspectionId);
}
