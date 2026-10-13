package com.campus.rentaequipos.shared.domain.valueobject;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Value Object - Money Tests")
class MoneyTest {

    @Test
    @DisplayName("Debe crear Money correctamente y formatear a 2 decimales")
    void shouldCreateMoneyWithTwoDecimals() {
        Money money = Money.of(150.5);
        assertEquals(new BigDecimal("150.50"), money.getAmount());
    }

    @Test
    @DisplayName("Debe sumar dos montos de Money")
    void shouldAddMoney() {
        Money m1 = Money.of(100.00);
        Money m2 = Money.of(50.25);
        Money result = m1.add(m2);

        assertEquals(new BigDecimal("150.25"), result.getAmount());
    }

    @Test
    @DisplayName("Debe restar dos montos de Money")
    void shouldSubtractMoney() {
        Money m1 = Money.of(100.00);
        Money m2 = Money.of(40.00);
        Money result = m1.subtract(m2);

        assertEquals(new BigDecimal("60.00"), result.getAmount());
    }

    @Test
    @DisplayName("Debe multiplicar Money por un factor")
    void shouldMultiplyMoney() {
        Money dailyRate = Money.of(25.00);
        Money total = dailyRate.multiply(5);

        assertEquals(new BigDecimal("125.00"), total.getAmount());
    }

    @Test
    @DisplayName("Debe lanzar excepción si el monto es nulo")
    void shouldThrowExceptionWhenAmountIsNull() {
        assertThrows(IllegalArgumentException.class, () -> new Money(null));
    }
}
