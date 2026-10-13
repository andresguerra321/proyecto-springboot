package com.campus.rentaequipos.billing.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "invoices")
public class InvoiceJpaEntity {

    @Id
    private UUID id;

    @Column(name = "invoice_number", nullable = false, unique = true, length = 50)
    private String invoiceNumber;

    @Column(name = "rental_id", nullable = false, unique = true)
    private UUID rentalId;

    @Column(name = "payment_id", nullable = false, unique = true)
    private UUID paymentId;

    @Column(name = "issue_date", nullable = false)
    private LocalDateTime issueDate;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "tax_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal taxAmount;

    @Column(name = "total_billed", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalBilled;

    @Column(name = "pdf_url", length = 350)
    private String pdfUrl;

    public InvoiceJpaEntity() {}

    public InvoiceJpaEntity(UUID id, String invoiceNumber, UUID rentalId, UUID paymentId, LocalDateTime issueDate,
                            BigDecimal subtotal, BigDecimal taxAmount, BigDecimal totalBilled, String pdfUrl) {
        this.id = id;
        this.invoiceNumber = invoiceNumber;
        this.rentalId = rentalId;
        this.paymentId = paymentId;
        this.issueDate = issueDate;
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
    public BigDecimal getSubtotal() { return subtotal; }
    public BigDecimal getTaxAmount() { return taxAmount; }
    public BigDecimal getTotalBilled() { return totalBilled; }
    public String getPdfUrl() { return pdfUrl; }
}
