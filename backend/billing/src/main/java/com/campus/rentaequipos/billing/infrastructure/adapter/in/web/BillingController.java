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

    @GetMapping(value = "/invoices/{id}/html", produces = org.springframework.http.MediaType.TEXT_HTML_VALUE)
    @Operation(summary = "Descargar/Imprimir Factura en HTML", description = "Genera una vista de comprobante fiscal imprimible con estilos CSS @media print")
    public ResponseEntity<String> getInvoiceHtml(@PathVariable UUID id) {
        InvoiceResponse invoice = billingUseCase.getInvoiceById(id);
        String html = String.format("""
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Factura Electrónica %s</title>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #212529; background: #fdfdfd; }
                    .invoice-box { max-width: 800px; margin: auto; padding: 35px; border: 1px solid #dee2e6; border-radius: 8px; background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 25px; }
                    .brand { font-size: 24px; font-weight: 700; color: #2563eb; }
                    .brand span { color: #f59e0b; }
                    .invoice-title { text-align: right; }
                    .invoice-title h2 { margin: 0; color: #1e293b; }
                    .invoice-title p { margin: 4px 0 0; color: #64748b; font-size: 14px; }
                    .details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
                    .details div { background: #f8fafc; padding: 15px; border-radius: 6px; }
                    .details h4 { margin: 0 0 8px; color: #334155; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
                    .details p { margin: 4px 0; font-size: 13px; color: #475569; }
                    table { width: 100%%; border-collapse: collapse; margin-bottom: 25px; }
                    th { background: #f1f5f9; color: #334155; text-align: left; padding: 12px; font-size: 13px; font-weight: 600; }
                    td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
                    .totals { width: 320px; margin-left: auto; margin-bottom: 30px; }
                    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #475569; }
                    .totals-row.grand-total { border-top: 2px solid #2563eb; padding-top: 10px; margin-top: 6px; font-weight: 700; font-size: 18px; color: #1e293b; }
                    .actions { text-align: center; margin-top: 20px; }
                    .btn-print { background: #2563eb; color: #fff; border: none; padding: 10px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
                    .btn-print:hover { background: #1d4ed8; }
                    @media print {
                        body { margin: 0; background: #fff; }
                        .invoice-box { border: none; box-shadow: none; padding: 0; max-width: 100%%; }
                        .actions { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="actions">
                    <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar en PDF</button>
                </div>
                <div class="invoice-box">
                    <div class="header">
                        <div class="brand">Renta<span>Equipos</span> Construcción</div>
                        <div class="invoice-title">
                            <h2>FACTURA DE VENTA</h2>
                            <p>No: <strong>%s</strong></p>
                        </div>
                    </div>
                    <div class="details">
                        <div>
                            <h4>Emisor</h4>
                            <p><strong>Plataforma RentaEquipos S.A.S.</strong></p>
                            <p>NIT: 901.884.221-5</p>
                            <p>Bucaramanga, Santander, Colombia</p>
                            <p>soporte@rentaequipos.com</p>
                        </div>
                        <div>
                            <h4>Detalles de Facturación</h4>
                            <p><strong>Fecha de Emisión:</strong> %s</p>
                            <p><strong>Código de Alquiler:</strong> %s</p>
                            <p><strong>Referencia de Pago:</strong> %s</p>
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Concepto</th>
                                <th>Período</th>
                                <th style="text-align: right;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Alquiler de Maquinaria y Equipos de Construcción</td>
                                <td>Según Contrato de Reserva</td>
                                <td style="text-align: right;">$%,.2f USD</td>
                            </tr>
                        </tbody>
                    </table>
                    <div class="totals">
                        <div class="totals-row">
                            <span>Subtotal:</span>
                            <span>$%,.2f USD</span>
                        </div>
                        <div class="totals-row">
                            <span>IVA (19%%):</span>
                            <span>$%,.2f USD</span>
                        </div>
                        <div class="totals-row grand-total">
                            <span>Total Facturado:</span>
                            <span>$%,.2f USD</span>
                        </div>
                    </div>
                    <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 30px;">
                        Documento contable generado automáticamente según normativa DIAN. Para consultas o reclamaciones comuníquese a soporte@rentaequipos.com.
                    </p>
                </div>
            </body>
            </html>
            """,
            invoice.invoiceNumber(),
            invoice.invoiceNumber(),
            invoice.issueDate(),
            invoice.rentalId(),
            invoice.paymentId(),
            invoice.subtotal(),
            invoice.subtotal(),
            invoice.taxAmount(),
            invoice.totalBilled()
        );
        return ResponseEntity.ok(html);
    }
}
