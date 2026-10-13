package com.campus.rentaequipos.billing.infrastructure.adapter.out.persistence.repository;

import com.campus.rentaequipos.billing.infrastructure.adapter.out.persistence.entity.InvoiceJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface SpringDataInvoiceRepository extends JpaRepository<InvoiceJpaEntity, UUID> {
    Optional<InvoiceJpaEntity> findByInvoiceNumber(String invoiceNumber);
    Optional<InvoiceJpaEntity> findByRentalId(UUID rentalId);
}
