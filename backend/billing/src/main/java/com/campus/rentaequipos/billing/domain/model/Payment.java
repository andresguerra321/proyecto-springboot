package com.campus.rentaequipos.billing.domain.model;

import com.campus.rentaequipos.shared.domain.valueobject.Money;
import java.time.LocalDateTime;
import java.util.UUID;

public class Payment {
    private UUID id;
    private String paymentReference;
    private UUID rentalId;
    private Money amount;
    private String paymentMethod;
    private String paymentStatus;
    private LocalDateTime transactionDate;

    public Payment(UUID id, String paymentReference, UUID rentalId, Money amount, String paymentMethod, String paymentStatus, LocalDateTime transactionDate) {
        this.id = id;
        this.paymentReference = paymentReference;
        this.rentalId = rentalId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.paymentStatus = paymentStatus != null ? paymentStatus : "PENDING";
        this.transactionDate = transactionDate != null ? transactionDate : LocalDateTime.now();
    }

    public void complete() {
        this.paymentStatus = "COMPLETED";
    }

    public UUID getId() { return id; }
    public String getPaymentReference() { return paymentReference; }
    public UUID getRentalId() { return rentalId; }
    public Money getAmount() { return amount; }
    public String getPaymentMethod() { return paymentMethod; }
    public String getPaymentStatus() { return paymentStatus; }
    public LocalDateTime getTransactionDate() { return transactionDate; }
}
