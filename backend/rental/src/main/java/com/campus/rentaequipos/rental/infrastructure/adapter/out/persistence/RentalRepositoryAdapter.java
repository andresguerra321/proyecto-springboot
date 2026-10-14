package com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence;

import com.campus.rentaequipos.rental.domain.model.Rental;
import com.campus.rentaequipos.rental.domain.model.RentalItem;
import com.campus.rentaequipos.rental.domain.model.RentalItemStatus;
import com.campus.rentaequipos.rental.domain.model.RentalStatus;
import com.campus.rentaequipos.rental.domain.repository.RentalRepository;
import com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence.entity.RentalItemJpaEntity;
import com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence.entity.RentalJpaEntity;
import com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence.repository.SpringDataRentalRepository;
import com.campus.rentaequipos.shared.domain.valueobject.DateRange;
import com.campus.rentaequipos.shared.domain.valueobject.Money;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@Transactional
public class RentalRepositoryAdapter implements RentalRepository {

    private final SpringDataRentalRepository repository;

    public RentalRepositoryAdapter(SpringDataRentalRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<Rental> findById(UUID id) {
        return repository.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<Rental> findByRentalCode(String rentalCode) {
        return repository.findByRentalCode(rentalCode).map(this::toDomain);
    }

    @Override
    public List<Rental> findByClientId(UUID clientId) {
        return repository.findByClientId(clientId).stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public List<Rental> findAll() {
        return repository.findAll().stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public Rental save(Rental rental) {
        RentalJpaEntity entity = toEntity(rental);
        RentalJpaEntity saved = repository.save(entity);
        return toDomain(saved);
    }

    private Rental toDomain(RentalJpaEntity entity) {
        List<RentalItem> items = entity.getItems().stream()
                .map(item -> new RentalItem(
                        item.getId(),
                        item.getToolId(),
                        Money.of(item.getDailyPrice()),
                        Money.of(item.getTotalPrice()),
                        RentalItemStatus.valueOf(item.getStatus())
                ))
                .collect(Collectors.toList());

        return new Rental(
                entity.getId(),
                entity.getRentalCode(),
                entity.getClientId(),
                new DateRange(entity.getStartDate(), entity.getEndDate()),
                entity.getTotalDays(),
                Money.of(entity.getSubtotal()),
                Money.of(entity.getDeposit()),
                Money.of(entity.getTotalAmount()),
                RentalStatus.valueOf(entity.getStatus()),
                items
        );
    }

    private RentalJpaEntity toEntity(Rental rental) {
        List<RentalItemJpaEntity> items = rental.getItems().stream()
                .map(item -> new RentalItemJpaEntity(
                        item.getId(),
                        rental.getId(),
                        item.getToolId(),
                        item.getDailyPrice().getAmount(),
                        item.getTotalPrice().getAmount(),
                        item.getStatus().name()
                ))
                .collect(Collectors.toList());

        return new RentalJpaEntity(
                rental.getId(),
                rental.getRentalCode(),
                rental.getClientId(),
                rental.getDateRange().getStartDate(),
                rental.getDateRange().getEndDate(),
                rental.getTotalDays(),
                rental.getSubtotal().getAmount(),
                rental.getDeposit().getAmount(),
                rental.getTotalAmount().getAmount(),
                rental.getStatus().name(),
                items
        );
    }
}
