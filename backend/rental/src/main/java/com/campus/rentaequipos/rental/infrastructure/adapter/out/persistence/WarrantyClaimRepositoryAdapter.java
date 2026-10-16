package com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence;

import com.campus.rentaequipos.rental.domain.model.WarrantyClaim;
import com.campus.rentaequipos.rental.domain.repository.WarrantyClaimRepository;
import com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence.entity.WarrantyClaimJpaEntity;
import com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence.repository.SpringDataWarrantyClaimRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class WarrantyClaimRepositoryAdapter implements WarrantyClaimRepository {

    private final SpringDataWarrantyClaimRepository repository;

    public WarrantyClaimRepositoryAdapter(SpringDataWarrantyClaimRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<WarrantyClaim> findById(UUID id) {
        return repository.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<WarrantyClaim> findByTicketNumber(String ticketNumber) {
        return repository.findByTicketNumber(ticketNumber).map(this::toDomain);
    }

    @Override
    public List<WarrantyClaim> findByRentalId(UUID rentalId) {
        return repository.findByRentalIdOrderByCreatedAtDesc(rentalId).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<WarrantyClaim> findByProviderId(UUID providerId) {
        return repository.findByProviderId(providerId).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<WarrantyClaim> findAll() {
        return repository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public WarrantyClaim save(WarrantyClaim claim) {
        WarrantyClaimJpaEntity entity = toEntity(claim);
        WarrantyClaimJpaEntity saved = repository.save(entity);
        return toDomain(saved);
    }

    private WarrantyClaim toDomain(WarrantyClaimJpaEntity entity) {
        return new WarrantyClaim(
                entity.getId(),
                entity.getTicketNumber(),
                entity.getRentalId(),
                entity.getToolId(),
                entity.getClaimType(),
                entity.getFaultType(),
                entity.getUrgency(),
                entity.getDescription(),
                entity.getContactPhone(),
                entity.getDeliveryAddress(),
                entity.getStatus(),
                entity.getResolutionNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private WarrantyClaimJpaEntity toEntity(WarrantyClaim domain) {
        return new WarrantyClaimJpaEntity(
                domain.getId(),
                domain.getTicketNumber(),
                domain.getRentalId(),
                domain.getToolId(),
                domain.getClaimType(),
                domain.getFaultType(),
                domain.getUrgency(),
                domain.getDescription(),
                domain.getContactPhone(),
                domain.getDeliveryAddress(),
                domain.getStatus(),
                domain.getResolutionNotes(),
                domain.getCreatedAt(),
                domain.getUpdatedAt()
        );
    }
}
