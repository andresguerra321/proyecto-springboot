package com.campus.rentaequipos.shared.domain.valueobject;

import java.io.Serializable;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;

/**
 * Value Object inmutable para representar valores monetarios.
 */
public final class Money implements Serializable {

    private static final long serialVersionUID = 1L;
    public static final Money ZERO = new Money(BigDecimal.ZERO);

    private final BigDecimal amount;

    public Money(BigDecimal amount) {
        if (amount == null) {
            throw new IllegalArgumentException("El monto no puede ser nulo");
        }
        this.amount = amount.setScale(2, RoundingMode.HALF_UP);
    }

    public static Money of(double amount) {
        return new Money(BigDecimal.valueOf(amount));
    }

    public static Money of(BigDecimal amount) {
        return new Money(amount);
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public Money add(Money other) {
        Objects.requireNonNull(other, "El valor a sumar no puede ser nulo");
        return new Money(this.amount.add(other.amount));
    }

    public Money subtract(Money other) {
        Objects.requireNonNull(other, "El valor a restar no puede ser nulo");
        return new Money(this.amount.subtract(other.amount));
    }

    public Money multiply(long factor) {
        return new Money(this.amount.multiply(BigDecimal.valueOf(factor)));
    }

    public Money multiply(BigDecimal factor) {
        Objects.requireNonNull(factor, "El factor no puede ser nulo");
        return new Money(this.amount.multiply(factor));
    }

    public boolean isPositive() {
        return this.amount.compareTo(BigDecimal.ZERO) > 0;
    }

    public boolean isNegative() {
        return this.amount.compareTo(BigDecimal.ZERO) < 0;
    }

    public boolean isGreaterThan(Money other) {
        return this.amount.compareTo(other.amount) > 0;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Money money = (Money) o;
        return amount.compareTo(money.amount) == 0;
    }

    @Override
    public int hashCode() {
        return Objects.hash(amount.stripTrailingZeros());
    }

    @Override
    public String toString() {
        return "$" + amount.toPlainString();
    }
}
