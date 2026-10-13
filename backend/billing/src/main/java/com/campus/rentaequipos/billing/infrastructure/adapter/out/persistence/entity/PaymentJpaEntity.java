package com.campus.rentaequipos.billing.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payments")
public class PaymentJpaEntity {

    @Id
    private UUID id;

    @Column(name = "payment_reference", nullable = false, unique = true, length = 60)
    private String paymentReference;

    @Column(name = "rental_id", nullable = false)
    private UUID rentalId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "payment_method", nullable = false, length = 40)
    private String paymentMethod;

    @Column(name = "payment_status", nullable = false, length = 30)
    private String paymentStatus;

    @Column(name = "transaction_date", nullable = false)
    private LocalDateTime transactionDate;

    public PaymentJpaEntity() {}

    public PaymentJpaEntity(UUID id, String paymentReference, UUID rentalId, BigDecimal amount, String paymentMethod, String paymentStatus, LocalDateTime transactionDate) {
        this.id = id;
        this.paymentReference = paymentReference;
        this.rentalId = rentalId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.paymentStatus = paymentStatus;
        this.transactionDate = transactionDate;
    }

    public UUID getId() { return id; }
    public String getPaymentReference() { return paymentReference; }
    public UUID getRentalId() { return rentalId; }
    public BigDecimal getAmount() { return amount; }
    public String getPaymentMethod() { return paymentMethod; }
    public String getPaymentStatus() { return paymentStatus; }
    public LocalDateTime getTransactionDate() { return transactionDate; }
}
