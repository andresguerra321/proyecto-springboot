package com.campus.rentaequipos.billing.infrastructure.adapter.out.persistence;

import com.campus.rentaequipos.billing.domain.model.Payment;
import com.campus.rentaequipos.billing.domain.repository.PaymentRepository;
import com.campus.rentaequipos.billing.infrastructure.adapter.out.persistence.entity.PaymentJpaEntity;
import com.campus.rentaequipos.billing.infrastructure.adapter.out.persistence.repository.SpringDataPaymentRepository;
import com.campus.rentaequipos.shared.domain.valueobject.Money;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class PaymentRepositoryAdapter implements PaymentRepository {

    private final SpringDataPaymentRepository repository;

    public PaymentRepositoryAdapter(SpringDataPaymentRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<Payment> findById(UUID id) {
        return repository.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<Payment> findByPaymentReference(String reference) {
        return repository.findByPaymentReference(reference).map(this::toDomain);
    }

    @Override
    public List<Payment> findByRentalId(UUID rentalId) {
        return repository.findByRentalId(rentalId).stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public Payment save(Payment payment) {
        PaymentJpaEntity entity = toEntity(payment);
        PaymentJpaEntity saved = repository.save(entity);
        return toDomain(saved);
    }

    private Payment toDomain(PaymentJpaEntity entity) {
        return new Payment(
                entity.getId(),
                entity.getPaymentReference(),
                entity.getRentalId(),
                Money.of(entity.getAmount()),
                entity.getPaymentMethod(),
                entity.getPaymentStatus(),
                entity.getTransactionDate()
        );
    }

    private PaymentJpaEntity toEntity(Payment payment) {
        return new PaymentJpaEntity(
                payment.getId(),
                payment.getPaymentReference(),
                payment.getRentalId(),
                payment.getAmount().getAmount(),
                payment.getPaymentMethod(),
                payment.getPaymentStatus(),
                payment.getTransactionDate()
        );
    }
}
