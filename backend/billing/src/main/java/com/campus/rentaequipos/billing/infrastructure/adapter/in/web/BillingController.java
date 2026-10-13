package com.campus.rentaequipos.billing.infrastructure.adapter.in.web;

import com.campus.rentaequipos.billing.application.dto.InvoiceResponse;
import com.campus.rentaequipos.billing.application.dto.PaymentRequest;
import com.campus.rentaequipos.billing.application.dto.PaymentResponse;
import com.campus.rentaequipos.billing.application.usecase.BillingUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/billing")
@Tag(name = "Billing", description = "Billing and Payments APIs")
public class BillingController {

    private final BillingUseCase billingUseCase;

    public BillingController(BillingUseCase billingUseCase) {
        this.billingUseCase = billingUseCase;
    }

    @PostMapping("/payments")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Process a payment", description = "Processes a payment for a rental and generates an invoice")
    public ResponseEntity<PaymentResponse> processPayment(@RequestBody PaymentRequest request) {
        PaymentResponse response = billingUseCase.processPayment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/payments/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get payment by ID", description = "Retrieves payment details by payment ID")
    public ResponseEntity<PaymentResponse> getPaymentById(@PathVariable UUID id) {
        return ResponseEntity.ok(billingUseCase.getPaymentById(id));
    }

    @GetMapping("/payments/rental/{rentalId}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get payments by rental ID", description = "Retrieves payments made for a specific rental")
    public ResponseEntity<List<PaymentResponse>> getPaymentsByRentalId(@PathVariable UUID rentalId) {
        return ResponseEntity.ok(billingUseCase.getPaymentsByRentalId(rentalId));
    }

    @GetMapping("/invoices/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get invoice by ID", description = "Retrieves invoice details by invoice ID")
    public ResponseEntity<InvoiceResponse> getInvoiceById(@PathVariable UUID id) {
        return ResponseEntity.ok(billingUseCase.getInvoiceById(id));
    }

    @GetMapping("/invoices/rental/{rentalId}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get invoice by rental ID", description = "Retrieves the invoice associated with a specific rental")
    public ResponseEntity<InvoiceResponse> getInvoiceByRentalId(@PathVariable UUID rentalId) {
        return ResponseEntity.ok(billingUseCase.getInvoiceByRentalId(rentalId));
    }
}
