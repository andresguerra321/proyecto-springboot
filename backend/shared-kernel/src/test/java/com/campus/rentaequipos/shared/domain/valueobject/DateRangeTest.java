package com.campus.rentaequipos.shared.domain.valueobject;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Value Object - DateRange Tests")
class DateRangeTest {

    @Test
    @DisplayName("Debe calcular correctamente la cantidad de días entre fechas")
    void shouldCalculateDaysCorrectly() {
        LocalDate start = LocalDate.of(2026, 5, 1);
        LocalDate end = LocalDate.of(2026, 5, 5);

        DateRange range = DateRange.of(start, end);
        assertEquals(4, range.getDays());
    }

    @Test
    @DisplayName("Debe retornar mínimo 1 día si inicio y fin son el mismo día")
    void shouldReturnMinimumOneDayForSameDate() {
        LocalDate sameDay = LocalDate.of(2026, 5, 1);
        DateRange range = DateRange.of(sameDay, sameDay);

        assertEquals(1, range.getDays());
    }

    @Test
    @DisplayName("Debe fallar si la fecha fin es anterior a la fecha inicio")
    void shouldThrowExceptionWhenEndIsBeforeStart() {
        LocalDate start = LocalDate.of(2026, 5, 10);
        LocalDate end = LocalDate.of(2026, 5, 1);

        assertThrows(IllegalArgumentException.class, () -> DateRange.of(start, end));
    }

    @Test
    @DisplayName("Debe verificar solapamiento entre rangos correctamente")
    void shouldCheckOverlaps() {
        DateRange range1 = DateRange.of(LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 10));
        DateRange range2 = DateRange.of(LocalDate.of(2026, 5, 5), LocalDate.of(2026, 5, 15));
        DateRange range3 = DateRange.of(LocalDate.of(2026, 5, 11), LocalDate.of(2026, 5, 20));

        assertTrue(range1.overlaps(range2));
        assertFalse(range1.overlaps(range3));
    }
}
