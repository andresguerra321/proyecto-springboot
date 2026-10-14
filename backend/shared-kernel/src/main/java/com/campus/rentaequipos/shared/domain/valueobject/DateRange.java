package com.campus.rentaequipos.shared.domain.valueobject;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Objects;

/**
 * Value Object inmutable para representar rangos de fechas (ej. alquileres y reservas).
 */
public final class DateRange implements Serializable {

    private static final long serialVersionUID = 1L;

    private final LocalDate startDate;
    private final LocalDate endDate;

    public DateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("Las fechas de inicio y fin son obligatorias");
        }
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("La fecha de fin no puede ser anterior a la fecha de inicio");
        }
        this.startDate = startDate;
        this.endDate = endDate;
    }

    public static DateRange of(LocalDate startDate, LocalDate endDate) {
        return new DateRange(startDate, endDate);
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    /**
     * Calcula la cantidad total de días facturables incluidos en el rango (ambos extremos inclusive, mínimo 1 día).
     * Ejemplo: Del 15 al 18 de octubre = 4 días facturables (día de entrega y día de devolución computables).
     */
    public long getDays() {
        return ChronoUnit.DAYS.between(startDate, endDate) + 1;
    }

    /**
     * Verifica si dos rangos de fechas se solapan/traslapan.
     */
    public boolean overlaps(DateRange other) {
        Objects.requireNonNull(other, "El otro rango de fechas no puede ser nulo");
        return !this.endDate.isBefore(other.startDate) && !other.endDate.isBefore(this.startDate);
    }

    /**
     * Verifica si una fecha específica cae dentro del rango.
     */
    public boolean includes(LocalDate date) {
        Objects.requireNonNull(date, "La fecha no puede ser nula");
        return (date.isEqual(startDate) || date.isAfter(startDate)) &&
               (date.isEqual(endDate) || date.isBefore(endDate));
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DateRange dateRange = (DateRange) o;
        return Objects.equals(startDate, dateRange.startDate) && Objects.equals(endDate, dateRange.endDate);
    }

    @Override
    public int hashCode() {
        return Objects.hash(startDate, endDate);
    }

    @Override
    public String toString() {
        return startDate + " -> " + endDate + " (" + getDays() + " días)";
    }
}
