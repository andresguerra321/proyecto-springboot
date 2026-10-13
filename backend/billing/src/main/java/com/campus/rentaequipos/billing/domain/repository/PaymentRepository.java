package com.campus.rentaequipos.billing.domain.repository;

import com.campus.rentaequipos.billing.domain.model.Payment;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository {
    Optional<Payment> findById(UUID id);
    Optional<Payment> findByPaymentReference(String reference);
    List<Payment> findByRentalId(UUID rentalId);
    Payment save(Payment payment);
}
