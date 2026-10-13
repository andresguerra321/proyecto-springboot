package com.campus.rentaequipos.billing.infrastructure.adapter.out.persistence.repository;

import com.campus.rentaequipos.billing.infrastructure.adapter.out.persistence.entity.PaymentJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SpringDataPaymentRepository extends JpaRepository<PaymentJpaEntity, UUID> {
    Optional<PaymentJpaEntity> findByPaymentReference(String paymentReference);
    List<PaymentJpaEntity> findByRentalId(UUID rentalId);
}
