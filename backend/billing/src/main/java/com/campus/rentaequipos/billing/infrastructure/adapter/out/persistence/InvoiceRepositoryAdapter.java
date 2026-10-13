package com.campus.rentaequipos.billing.infrastructure.adapter.out.persistence;

import com.campus.rentaequipos.billing.domain.model.Invoice;
import com.campus.rentaequipos.billing.domain.repository.InvoiceRepository;
import com.campus.rentaequipos.billing.infrastructure.adapter.out.persistence.entity.InvoiceJpaEntity;
import com.campus.rentaequipos.billing.infrastructure.adapter.out.persistence.repository.SpringDataInvoiceRepository;
import com.campus.rentaequipos.shared.domain.valueobject.Money;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
public class InvoiceRepositoryAdapter implements InvoiceRepository {

    private final SpringDataInvoiceRepository repository;

    public InvoiceRepositoryAdapter(SpringDataInvoiceRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<Invoice> findById(UUID id) {
        return repository.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<Invoice> findByInvoiceNumber(String invoiceNumber) {
        return repository.findByInvoiceNumber(invoiceNumber).map(this::toDomain);
    }

    @Override
    public Optional<Invoice> findByRentalId(UUID rentalId) {
        return repository.findByRentalId(rentalId).map(this::toDomain);
    }

    @Override
    public Invoice save(Invoice invoice) {
        InvoiceJpaEntity entity = toEntity(invoice);
        InvoiceJpaEntity saved = repository.save(entity);
        return toDomain(saved);
    }

    private Invoice toDomain(InvoiceJpaEntity entity) {
        return new Invoice(
                entity.getId(),
                entity.getInvoiceNumber(),
                entity.getRentalId(),
                entity.getPaymentId(),
                entity.getIssueDate(),
                Money.of(entity.getSubtotal()),
                Money.of(entity.getTaxAmount()),
                Money.of(entity.getTotalBilled()),
                entity.getPdfUrl()
        );
    }

    private InvoiceJpaEntity toEntity(Invoice invoice) {
        return new InvoiceJpaEntity(
                invoice.getId(),
                invoice.getInvoiceNumber(),
                invoice.getRentalId(),
                invoice.getPaymentId(),
                invoice.getIssueDate(),
                invoice.getSubtotal().getAmount(),
                invoice.getTaxAmount().getAmount(),
                invoice.getTotalBilled().getAmount(),
                invoice.getPdfUrl()
        );
    }
}
