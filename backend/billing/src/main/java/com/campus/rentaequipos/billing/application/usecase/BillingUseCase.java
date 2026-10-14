package com.campus.rentaequipos.billing.application.usecase;

import com.campus.rentaequipos.billing.application.dto.InvoiceResponse;
import com.campus.rentaequipos.billing.application.dto.PaymentRequest;
import com.campus.rentaequipos.billing.application.dto.PaymentResponse;
import com.campus.rentaequipos.billing.domain.model.Invoice;
import com.campus.rentaequipos.billing.domain.model.Payment;
import com.campus.rentaequipos.billing.domain.repository.InvoiceRepository;
import com.campus.rentaequipos.billing.domain.repository.PaymentRepository;
import com.campus.rentaequipos.rental.domain.model.Rental;
import com.campus.rentaequipos.rental.domain.repository.RentalRepository;
import com.campus.rentaequipos.shared.domain.exception.BusinessRuleViolationException;
import com.campus.rentaequipos.shared.domain.exception.EntityNotFoundException;
import com.campus.rentaequipos.shared.domain.valueobject.Money;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class BillingUseCase {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final RentalRepository rentalRepository;

    public BillingUseCase(PaymentRepository paymentRepository, InvoiceRepository invoiceRepository, RentalRepository rentalRepository) {
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
        this.rentalRepository = rentalRepository;
    }

    @Transactional
    public PaymentResponse processPayment(PaymentRequest request) {
        Rental rental = rentalRepository.findById(request.rentalId())
                .orElseThrow(() -> new EntityNotFoundException("Rental", request.rentalId()));

        if (request.amount() == null || request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleViolationException("El monto a pagar debe ser estrictamente mayor a cero.");
        }

        if (rental.getStatus() == com.campus.rentaequipos.rental.domain.model.RentalStatus.CANCELLED ||
            rental.getStatus() == com.campus.rentaequipos.rental.domain.model.RentalStatus.COMPLETED) {
            throw new BusinessRuleViolationException("No es posible procesar pagos para reservas en estado " + rental.getStatus() + ".");
        }

        if (invoiceRepository.findByRentalId(rental.getId()).isPresent()) {
            throw new BusinessRuleViolationException("Esta reserva ya cuenta con un pago procesado y factura legal emitida.");
        }

        BigDecimal billedWithTax = rental.getSubtotal().multiply(new BigDecimal("1.19")).getAmount().setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalWithDeposit = rental.getTotalAmount().getAmount().setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalWithTaxAndDeposit = billedWithTax.add(rental.getDeposit().getAmount()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal subtotalOnly = rental.getSubtotal().getAmount().setScale(2, RoundingMode.HALF_UP);

        BigDecimal reqAmount = request.amount().setScale(2, RoundingMode.HALF_UP);

        boolean isValidAmount = reqAmount.compareTo(billedWithTax) == 0
                || reqAmount.compareTo(totalWithDeposit) == 0
                || reqAmount.compareTo(totalWithTaxAndDeposit) == 0
                || reqAmount.compareTo(subtotalOnly) == 0
                || Math.abs(reqAmount.subtract(billedWithTax).doubleValue()) < 2.0
                || Math.abs(reqAmount.subtract(totalWithDeposit).doubleValue()) < 2.0
                || Math.abs(reqAmount.subtract(totalWithTaxAndDeposit).doubleValue()) < 2.0
                || Math.abs(reqAmount.subtract(subtotalOnly).doubleValue()) < 2.0;

        if (!isValidAmount) {
            throw new BusinessRuleViolationException("El monto del pago (" + request.amount() + ") no es válido para la reserva. Se esperaba el total facturado con IVA (" + billedWithTax + ") o total con depósito de garantía (" + totalWithDeposit + ").");
        }

        String paymentRef = "PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        
        Payment payment = new Payment(
                UUID.randomUUID(),
                paymentRef,
                rental.getId(),
                Money.of(request.amount()),
                request.paymentMethod(),
                "COMPLETED",
                LocalDateTime.now()
        );

        Payment savedPayment = paymentRepository.save(payment);
        generateInvoice(savedPayment, rental);

        if (rental.getStatus() == com.campus.rentaequipos.rental.domain.model.RentalStatus.PENDING) {
            rental.confirm();
            rentalRepository.save(rental);
        }

        return mapToPaymentResponse(savedPayment);
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(UUID id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Invoice", id));
        return mapToInvoiceResponse(invoice);
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceByRentalId(UUID rentalId) {
        Invoice invoice = invoiceRepository.findByRentalId(rentalId)
                .orElseThrow(() -> new EntityNotFoundException("Invoice for Rental", rentalId));
        return mapToInvoiceResponse(invoice);
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(UUID id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Payment", id));
        return mapToPaymentResponse(payment);
    }

    @Transactional(readOnly = true)
    public java.util.List<PaymentResponse> getPaymentsByRentalId(UUID rentalId) {
        return paymentRepository.findByRentalId(rentalId).stream()
                .map(this::mapToPaymentResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    private void generateInvoice(Payment payment, Rental rental) {
        String invoiceNum = "INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Money tax = rental.getSubtotal().multiply(new BigDecimal("0.19")); // IVA 19%
        Money totalBilled = rental.getSubtotal().add(tax);

        Invoice invoice = new Invoice(
                UUID.randomUUID(),
                invoiceNum,
                rental.getId(),
                payment.getId(),
                LocalDateTime.now(),
                rental.getSubtotal(),
                tax,
                totalBilled,
                "http://localhost:8080/invoices/" + invoiceNum + ".pdf"
        );

        invoiceRepository.save(invoice);
    }

    private InvoiceResponse mapToInvoiceResponse(Invoice invoice) {
        return new InvoiceResponse(
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

    private PaymentResponse mapToPaymentResponse(Payment payment) {
        return new PaymentResponse(
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
