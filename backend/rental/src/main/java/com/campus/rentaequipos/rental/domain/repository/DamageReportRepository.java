package com.campus.rentaequipos.rental.domain.repository;

import com.campus.rentaequipos.rental.domain.model.DamageReport;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DamageReportRepository {
    Optional<DamageReport> findById(UUID id);
    List<DamageReport> findByInspectionId(UUID inspectionId);
    List<DamageReport> findAll();
    DamageReport save(DamageReport report);
}
