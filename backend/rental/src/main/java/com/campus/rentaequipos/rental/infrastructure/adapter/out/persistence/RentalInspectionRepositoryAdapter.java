package com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence;

import com.campus.rentaequipos.rental.domain.model.RentalInspection;
import com.campus.rentaequipos.rental.domain.repository.RentalInspectionRepository;
import com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence.entity.RentalInspectionJpaEntity;
import com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence.repository.SpringDataRentalInspectionRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class RentalInspectionRepositoryAdapter implements RentalInspectionRepository {

    private final SpringDataRentalInspectionRepository repository;

    public RentalInspectionRepositoryAdapter(SpringDataRentalInspectionRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<RentalInspection> findById(UUID id) {
        return repository.findById(id).map(this::toDomain);
    }

    @Override
    public List<RentalInspection> findByRentalId(UUID rentalId) {
        return repository.findByRentalId(rentalId).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public RentalInspection save(RentalInspection inspection) {
        RentalInspectionJpaEntity entity = toEntity(inspection);
        RentalInspectionJpaEntity saved = repository.save(entity);
        return toDomain(saved);
    }

    private RentalInspection toDomain(RentalInspectionJpaEntity entity) {
        return new RentalInspection(
                entity.getId(),
                entity.getRentalId(),
                entity.getInspectionType(),
                entity.getInspectionDate(),
                entity.getInspectorNotes(),
                entity.getInspectorUserId(),
                entity.getStatus()
        );
    }

    private RentalInspectionJpaEntity toEntity(RentalInspection inspection) {
        return new RentalInspectionJpaEntity(
                inspection.getId(),
                inspection.getRentalId(),
                inspection.getInspectionType(),
                inspection.getInspectionDate(),
                inspection.getInspectorNotes(),
                inspection.getInspectorUserId(),
                inspection.getStatus()
        );
    }
}
