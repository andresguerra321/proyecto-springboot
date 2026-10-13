package com.campus.rentaequipos.billing.domain.repository;

import com.campus.rentaequipos.billing.domain.model.Invoice;
import java.util.Optional;
import java.util.UUID;

public interface InvoiceRepository {
    Optional<Invoice> findById(UUID id);
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    Optional<Invoice> findByRentalId(UUID rentalId);
    Invoice save(Invoice invoice);
}
