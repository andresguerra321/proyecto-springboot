package com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence;

import com.campus.rentaequipos.rental.domain.model.DamageReport;
import com.campus.rentaequipos.rental.domain.repository.DamageReportRepository;
import com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence.entity.DamageReportJpaEntity;
import com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence.repository.SpringDataDamageReportRepository;
import com.campus.rentaequipos.shared.domain.valueobject.Money;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class DamageReportRepositoryAdapter implements DamageReportRepository {

    private final SpringDataDamageReportRepository repository;

    public DamageReportRepositoryAdapter(SpringDataDamageReportRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<DamageReport> findById(UUID id) {
        return repository.findById(id).map(this::toDomain);
    }

    @Override
    public List<DamageReport> findByInspectionId(UUID inspectionId) {
        return repository.findByInspectionId(inspectionId).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<DamageReport> findAll() {
        return repository.findAll().stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public DamageReport save(DamageReport report) {
        DamageReportJpaEntity entity = toEntity(report);
        DamageReportJpaEntity saved = repository.save(entity);
        return toDomain(saved);
    }

    private DamageReport toDomain(DamageReportJpaEntity entity) {
        return new DamageReport(
                entity.getId(),
                entity.getInspectionId(),
                entity.getToolId(),
                entity.getSeverity(),
                entity.getDescription(),
                Money.of(entity.getRepairCost()),
                entity.isChargedToClient()
        );
    }

    private DamageReportJpaEntity toEntity(DamageReport report) {
        return new DamageReportJpaEntity(
                report.getId(),
                report.getInspectionId(),
                report.getToolId(),
                report.getSeverity(),
                report.getDescription(),
                report.getRepairCost().getAmount(),
                report.isChargedToClient()
        );
    }
}
