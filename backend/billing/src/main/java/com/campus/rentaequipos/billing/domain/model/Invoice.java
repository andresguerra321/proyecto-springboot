package com.campus.rentaequipos.billing.domain.model;

import com.campus.rentaequipos.shared.domain.valueobject.Money;
import java.time.LocalDateTime;
import java.util.UUID;

public class Invoice {
    private UUID id;
    private String invoiceNumber;
    private UUID rentalId;
    private UUID paymentId;
    private LocalDateTime issueDate;
    private Money subtotal;
    private Money taxAmount;
    private Money totalBilled;
    private String pdfUrl;

    public Invoice(UUID id, String invoiceNumber, UUID rentalId, UUID paymentId, LocalDateTime issueDate, Money subtotal, Money taxAmount, Money totalBilled, String pdfUrl) {
        this.id = id;
        this.invoiceNumber = invoiceNumber;
        this.rentalId = rentalId;
        this.paymentId = paymentId;
        this.issueDate = issueDate != null ? issueDate : LocalDateTime.now();
        this.subtotal = subtotal;
        this.taxAmount = taxAmount;
        this.totalBilled = totalBilled;
        this.pdfUrl = pdfUrl;
    }

    public UUID getId() { return id; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public UUID getRentalId() { return rentalId; }
    public UUID getPaymentId() { return paymentId; }
    public LocalDateTime getIssueDate() { return issueDate; }
    public Money getSubtotal() { return subtotal; }
    public Money getTaxAmount() { return taxAmount; }
    public Money getTotalBilled() { return totalBilled; }
    public String getPdfUrl() { return pdfUrl; }
}
