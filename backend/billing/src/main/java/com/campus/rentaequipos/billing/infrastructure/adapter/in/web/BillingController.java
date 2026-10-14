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
    private final com.campus.rentaequipos.catalog.infrastructure.security.ProviderOwnershipGuard guard;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public BillingController(BillingUseCase billingUseCase,
                             com.campus.rentaequipos.catalog.infrastructure.security.ProviderOwnershipGuard guard,
                             org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        this.billingUseCase = billingUseCase;
        this.guard = guard;
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostMapping("/payments")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Process a payment", description = "Procesa el pago de un alquiler, emite la factura y confirma automáticamente la reserva (PENDING -> CONFIRMED). Solo el cliente dueño o ADMIN.")
    public ResponseEntity<PaymentResponse> processPayment(
            @RequestBody PaymentRequest request,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        if (!guard.isAdmin(userDetails) && !guard.isClientOwnerOfRental(request.rentalId(), userDetails)) {
            throw new org.springframework.security.access.AccessDeniedException("Acceso denegado: solo el cliente dueño de la reserva puede pagarla");
        }
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
    @Operation(summary = "Descargar/Imprimir Factura en HTML", description = "Genera una vista de comprobante fiscal imprimible con datos reales de la base de datos")
    public ResponseEntity<String> getInvoiceHtml(@PathVariable UUID id) {
        InvoiceResponse invoice = billingUseCase.getInvoiceById(id);

        // Consultar datos reales de Cliente, Proveedor y Alquiler desde PostgreSQL
        var clientData = jdbcTemplate.query(
                "SELECT c.full_name, c.document_type, c.document_number, c.phone, c.address, c.city, u.email " +
                "FROM rentals r JOIN client_profiles c ON r.client_id = c.id JOIN users u ON c.user_id = u.id " +
                "WHERE r.id = ?",
                rs -> rs.next() ? new Object[]{
                        rs.getString("full_name"),
                        rs.getString("document_type") + " " + rs.getString("document_number"),
                        rs.getString("phone"),
                        rs.getString("address") + ", " + rs.getString("city"),
                        rs.getString("email")
                } : null,
                invoice.rentalId()
        );

        var providerData = jdbcTemplate.query(
                "SELECT DISTINCT p.company_name, p.tax_id, p.phone, p.address, p.city, u.email " +
                "FROM rental_items ri JOIN tools t ON ri.tool_id = t.id " +
                "JOIN provider_profiles p ON t.provider_id = p.id JOIN users u ON p.user_id = u.id " +
                "WHERE ri.rental_id = ? LIMIT 1",
                rs -> rs.next() ? new Object[]{
                        rs.getString("company_name"),
                        rs.getString("tax_id"),
                        rs.getString("phone"),
                        rs.getString("address") + ", " + rs.getString("city"),
                        rs.getString("email")
                } : null,
                invoice.rentalId()
        );

        var rentalInfo = jdbcTemplate.query(
                "SELECT rental_code, start_date, end_date, total_days FROM rentals WHERE id = ?",
                rs -> rs.next() ? new Object[]{
                        rs.getString("rental_code"),
                        rs.getString("start_date"),
                        rs.getString("end_date"),
                        rs.getInt("total_days")
                } : null,
                invoice.rentalId()
        );

        List<String> itemRows = jdbcTemplate.query(
                "SELECT t.name, t.brand, t.model, ri.daily_price, ri.total_price " +
                "FROM rental_items ri JOIN tools t ON ri.tool_id = t.id WHERE ri.rental_id = ?",
                (rs, rowNum) -> String.format(
                        "<tr><td><strong>%s</strong> (%s %s)</td><td style='text-align:center;'>%s días</td><td style='text-align:right;'>$%,.0f COP</td><td style='text-align:right;'><strong>$%,.0f COP</strong></td></tr>",
                        rs.getString("name"),
                        rs.getString("brand"),
                        rs.getString("model"),
                        rentalInfo != null ? rentalInfo[3] : 1,
                        rs.getDouble("daily_price"),
                        rs.getDouble("total_price")
                ),
                invoice.rentalId()
        );

        String clientName = clientData != null ? (String) clientData[0] : "Cliente ToolRent";
        String clientDoc = clientData != null ? (String) clientData[1] : "N/A";
        String clientPhone = clientData != null ? (String) clientData[2] : "N/A";
        String clientAddress = clientData != null ? (String) clientData[3] : "Colombia";
        String clientEmail = clientData != null ? (String) clientData[4] : "soporte@toolrent.com";

        String provName = providerData != null ? (String) providerData[0] : "ToolRent Maquinaria S.A.S.";
        String provNit = providerData != null ? (String) providerData[1] : "901.234.567-8";
        String provPhone = providerData != null ? (String) providerData[2] : "+57 (607) 632-1456";
        String provAddress = providerData != null ? (String) providerData[3] : "Zona Industrial Chimitá, Bucaramanga";

        String rentalCode = rentalInfo != null ? (String) rentalInfo[0] : invoice.rentalId().toString().substring(0, 8);
        String datesRange = rentalInfo != null ? (rentalInfo[1] + " hasta " + rentalInfo[2]) : "Período acordado";

        String itemsHtml = itemRows.isEmpty() ? "<tr><td colspan='4'>Alquiler de equipos de construcción</td></tr>" : String.join("", itemRows);

        String html = String.format("""
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Factura Oficial de Alquiler %s</title>
                <style>
                    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; margin: 30px; color: #0f172a; background: #f8fafc; }
                    .invoice-box { max-width: 840px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 16px; background: #fff; box-shadow: 0 10px 25px rgba(0,0,0,0.06); }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #ea580c; padding-bottom: 24px; margin-bottom: 28px; }
                    .brand { font-size: 26px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
                    .brand span { color: #ea580c; }
                    .invoice-title { text-align: right; }
                    .invoice-title h2 { margin: 0; color: #0f172a; font-size: 20px; font-weight: 800; }
                    .invoice-title p { margin: 4px 0 0; color: #64748b; font-size: 13px; }
                    .details { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
                    .details div { background: #f8fafc; padding: 18px; border-radius: 12px; border: 1px solid #e2e8f0; }
                    .details h4 { margin: 0 0 10px; color: #ea580c; font-size: 12px; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700; }
                    .details p { margin: 4px 0; font-size: 13px; color: #334155; }
                    table { width: 100%%; border-collapse: collapse; margin-bottom: 28px; }
                    th { background: #f1f5f9; color: #475569; text-align: left; padding: 12px 14px; font-size: 12px; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
                    td { padding: 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
                    .totals { width: 340px; margin-left: auto; margin-bottom: 30px; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; }
                    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #475569; }
                    .totals-row.grand-total { border-top: 2px solid #ea580c; padding-top: 10px; margin-top: 8px; font-weight: 800; font-size: 18px; color: #0f172a; }
                    .actions { text-align: center; margin-bottom: 25px; }
                    .btn-print { background: #ea580c; color: #fff; border: none; padding: 11px 28px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(234,88,12,0.25); }
                    .btn-print:hover { background: #c2410c; }
                    @media print {
                        body { margin: 0; background: #fff; }
                        .invoice-box { border: none; box-shadow: none; padding: 0; max-width: 100%%; }
                        .actions { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="actions">
                    <button class="btn-print" onclick="window.print()">🖨️ Imprimir Factura Oficial (PDF)</button>
                </div>
                <div class="invoice-box">
                    <div class="header">
                        <div>
                            <div class="brand">Tool<span>Rent</span> Colombia</div>
                            <p style="margin: 4px 0 0; color: #64748b; font-size: 12px;">Plataforma Oficial de Alquiler de Maquinaria y Equipos</p>
                        </div>
                        <div class="invoice-title">
                            <h2>FACTURA OFICIAL DE ALQUILER</h2>
                            <p>Factura N°: <strong style="color: #ea580c;">%s</strong></p>
                            <p>Emisión: %s</p>
                            <p>Contrato / Reserva: <strong>%s</strong></p>
                        </div>
                    </div>
                    <div class="details">
                        <div>
                            <h4>Datos del Arrendador (Proveedor)</h4>
                            <p><strong>%s</strong></p>
                            <p>NIT: <strong>%s</strong></p>
                            <p>Dirección: %s</p>
                            <p>Teléfono: %s</p>
                        </div>
                        <div>
                            <h4>Datos del Arrendatario (Cliente)</h4>
                            <p><strong>%s</strong></p>
                            <p>Identificación: <strong>%s</strong></p>
                            <p>Dirección: %s</p>
                            <p>Teléfono: %s</p>
                            <p>Correo: %s</p>
                        </div>
                    </div>
                    <p style="font-size: 12px; color: #475569; margin-bottom: 12px;"><strong>Vigencia del Contrato:</strong> %s</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Equipo / Maquinaria</th>
                                <th style="text-align: center;">Duración</th>
                                <th style="text-align: right;">Tarifa Diaria</th>
                                <th style="text-align: right;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            %s
                        </tbody>
                    </table>
                    <div class="totals">
                        <div class="totals-row">
                            <span>Subtotal Alquiler:</span>
                            <span style="font-weight: 600;">$%,.0f COP</span>
                        </div>
                        <div class="totals-row">
                            <span>IVA Legal (19%%):</span>
                            <span style="font-weight: 600;">$%,.0f COP</span>
                        </div>
                        <div class="totals-row grand-total">
                            <span>Total Facturado:</span>
                            <span style="color: #ea580c;">$%,.0f COP</span>
                        </div>
                    </div>
                    <div style="border-top: 1px solid #e2e8f0; padding-top: 18px; font-size: 11px; color: #94a3b8; text-align: center;">
                        <p>Documento contable de alquiler generado conforme al Estatuto Tributario y normativa de arrendamiento comercial DIAN Colombia.</p>
                        <p>ToolRent Colombia · NIT 901.234.567-8 · contacto@toolrent.co</p>
                    </div>
                </div>
            </body>
            </html>
            """,
            invoice.invoiceNumber(),
            invoice.invoiceNumber(),
            invoice.issueDate(),
            rentalCode,
            provName,
            provNit,
            provAddress,
            provPhone,
            clientName,
            clientDoc,
            clientAddress,
            clientPhone,
            clientEmail,
            datesRange,
            itemsHtml,
            invoice.subtotal(),
            invoice.taxAmount(),
            invoice.totalBilled()
        );
        return ResponseEntity.ok(html);
    }
}
