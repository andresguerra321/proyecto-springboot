package com.campus.rentaequipos.billing.application.usecase;

import com.campus.rentaequipos.billing.application.dto.PaymentRequest;
import com.campus.rentaequipos.billing.application.dto.PaymentResponse;
import com.campus.rentaequipos.billing.domain.model.Invoice;
import com.campus.rentaequipos.billing.domain.model.Payment;
import com.campus.rentaequipos.billing.domain.repository.InvoiceRepository;
import com.campus.rentaequipos.billing.domain.repository.PaymentRepository;
import com.campus.rentaequipos.rental.domain.model.Rental;
import com.campus.rentaequipos.rental.domain.model.RentalStatus;
import com.campus.rentaequipos.rental.domain.repository.RentalRepository;
import com.campus.rentaequipos.shared.domain.exception.BusinessRuleViolationException;
import com.campus.rentaequipos.shared.domain.valueobject.DateRange;
import com.campus.rentaequipos.shared.domain.valueobject.Money;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BillingUseCase Unit Tests")
class BillingUseCaseTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private RentalRepository rentalRepository;

    private BillingUseCase billingUseCase;

    private UUID rentalId;
    private Rental pendingRental;

    @BeforeEach
    void setUp() {
        billingUseCase = new BillingUseCase(paymentRepository, invoiceRepository, rentalRepository);
        rentalId = UUID.randomUUID();

        // 3 days: subtotal = 255.000, deposit = 480.000, totalAmount = 735.000
        // billedWithTax = 255.000 * 1.19 = 303.450
        pendingRental = new Rental(
                rentalId,
                "RNT-TEST-123",
                UUID.randomUUID(),
                DateRange.of(LocalDate.of(2026, 10, 15), LocalDate.of(2026, 10, 18)),
                3,
                Money.of(255000.00),
                Money.of(480000.00),
                Money.of(735000.00),
                RentalStatus.PENDING,
                Collections.emptyList()
        );
    }

    @Test
    @DisplayName("Debe procesar el pago exitosamente cuando se envía el valor facturado con IVA (303.450)")
    void shouldProcessPaymentWithBilledTaxAmount() {
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(pendingRental));
        when(invoiceRepository.findByRentalId(rentalId)).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentRequest request = new PaymentRequest(
                rentalId,
                new BigDecimal("303450.00"),
                "CREDIT_CARD"
        );

        PaymentResponse response = billingUseCase.processPayment(request);

        assertNotNull(response);
        assertEquals(new BigDecimal("303450.00"), response.amount());
        assertEquals("COMPLETED", response.paymentStatus());
        assertEquals(RentalStatus.CONFIRMED, pendingRental.getStatus());

        verify(paymentRepository).save(any(Payment.class));
        verify(invoiceRepository).save(any(Invoice.class));
        verify(rentalRepository).save(pendingRental);
    }

    @Test
    @DisplayName("Debe procesar el pago exitosamente cuando se envía el total con depósito (735.000)")
    void shouldProcessPaymentWithTotalAmountIncludingDeposit() {
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(pendingRental));
        when(invoiceRepository.findByRentalId(rentalId)).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentRequest request = new PaymentRequest(
                rentalId,
                new BigDecimal("735000.00"),
                "DEBIT_CARD"
        );

        PaymentResponse response = billingUseCase.processPayment(request);

        assertNotNull(response);
        assertEquals(new BigDecimal("735000.00"), response.amount());
        assertEquals(RentalStatus.CONFIRMED, pendingRental.getStatus());
    }

    @Test
    @DisplayName("Debe procesar el pago exitosamente cuando se envía el subtotal base (255.000)")
    void shouldProcessPaymentWithSubtotalOnly() {
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(pendingRental));
        when(invoiceRepository.findByRentalId(rentalId)).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentRequest request = new PaymentRequest(
                rentalId,
                new BigDecimal("255000.00"),
                "BANK_TRANSFER"
        );

        PaymentResponse response = billingUseCase.processPayment(request);

        assertNotNull(response);
        assertEquals(new BigDecimal("255000.00"), response.amount());
    }

    @Test
    @DisplayName("Debe listar los pagos del cliente ordenados del más reciente al más antiguo")
    void shouldGetPaymentsByClientIdInDescendingDateOrder() {
        UUID clientId = pendingRental.getClientId();
        Payment olderPayment = new Payment(
                UUID.randomUUID(), "PAY-OLDER", rentalId, Money.of(1000), "CREDIT_CARD",
                "COMPLETED", LocalDateTime.of(2026, 10, 15, 10, 0));
        Payment newerPayment = new Payment(
                UUID.randomUUID(), "PAY-NEWER", rentalId, Money.of(2000), "DEBIT_CARD",
                "COMPLETED", LocalDateTime.of(2026, 10, 16, 10, 0));

        when(rentalRepository.findByClientId(clientId)).thenReturn(List.of(pendingRental));
        when(paymentRepository.findByRentalId(rentalId)).thenReturn(List.of(olderPayment, newerPayment));

        List<PaymentResponse> payments = billingUseCase.getPaymentsByClientId(clientId);

        assertEquals(2, payments.size());
        assertEquals("PAY-NEWER", payments.get(0).paymentReference());
        assertEquals("PAY-OLDER", payments.get(1).paymentReference());
    }

    @Test
    @DisplayName("Debe rechazar el pago si el monto no corresponde a ningún total válido de la reserva")
    void shouldRejectInvalidPaymentAmount() {
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(pendingRental));
        when(invoiceRepository.findByRentalId(rentalId)).thenReturn(Optional.empty());

        PaymentRequest request = new PaymentRequest(
                rentalId,
                new BigDecimal("12345.00"),
                "CREDIT_CARD"
        );

        assertThrows(BusinessRuleViolationException.class, () -> billingUseCase.processPayment(request));
        verify(paymentRepository, never()).save(any());
        verify(invoiceRepository, never()).save(any());
    }

    @Test
    @DisplayName("Debe rechazar el pago si el monto es cero o negativo")
    void shouldRejectZeroOrNegativeAmount() {
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(pendingRental));

        PaymentRequest requestZero = new PaymentRequest(rentalId, BigDecimal.ZERO, "CREDIT_CARD");
        assertThrows(BusinessRuleViolationException.class, () -> billingUseCase.processPayment(requestZero));

        PaymentRequest requestNegative = new PaymentRequest(rentalId, new BigDecimal("-50.00"), "CREDIT_CARD");
        assertThrows(BusinessRuleViolationException.class, () -> billingUseCase.processPayment(requestNegative));
    }
}
