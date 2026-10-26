package com.campus.rentaequipos.rental.domain.model;

/**
 * Ciclo de vida de una reserva.
 * Equivalencias con el examen: PENDING = PENDIENTE, CONFIRMED = APROBADA, REJECTED = RECHAZADA.
 */
public enum RentalStatus {
    PENDING,
    CONFIRMED,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED,
    REJECTED
}
