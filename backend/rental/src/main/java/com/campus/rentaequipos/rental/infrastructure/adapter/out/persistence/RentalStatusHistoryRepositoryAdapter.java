package com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence;

import com.campus.rentaequipos.rental.domain.model.RentalStatusHistory;
import com.campus.rentaequipos.rental.domain.repository.RentalStatusHistoryRepository;
import com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence.entity.RentalStatusHistoryJpaEntity;
import com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence.repository.SpringDataRentalStatusHistoryRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class RentalStatusHistoryRepositoryAdapter implements RentalStatusHistoryRepository {

    private final SpringDataRentalStatusHistoryRepository repository;

    public RentalStatusHistoryRepositoryAdapter(SpringDataRentalStatusHistoryRepository repository) {
        this.repository = repository;
    }

    @Override
    public RentalStatusHistory save(RentalStatusHistory history) {
        RentalStatusHistoryJpaEntity entity = new RentalStatusHistoryJpaEntity(
                history.getId(),
                history.getRentalId(),
                history.getFromStatus(),
                history.getToStatus(),
                history.getChangedBy(),
                history.getChangedAt(),
                history.getNotes()
        );
        RentalStatusHistoryJpaEntity saved = repository.save(entity);
        return toDomain(saved);
    }

    @Override
    public List<RentalStatusHistory> findByRentalId(UUID rentalId) {
        return repository.findByRentalIdOrderByChangedAtAsc(rentalId).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    private RentalStatusHistory toDomain(RentalStatusHistoryJpaEntity entity) {
        return new RentalStatusHistory(
                entity.getId(),
                entity.getRentalId(),
                entity.getFromStatus(),
                entity.getToStatus(),
                entity.getChangedBy(),
                entity.getChangedAt(),
                entity.getNotes()
        );
    }
}
