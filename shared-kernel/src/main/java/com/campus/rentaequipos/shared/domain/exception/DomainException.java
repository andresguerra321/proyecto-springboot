package com.campus.rentaequipos.shared.domain.exception;

/**
 * Excepción base para violaciones de reglas en la capa de Dominio.
 */
public abstract class DomainException extends RuntimeException {

    public DomainException(String message) {
        super(message);
    }

    public DomainException(String message, Throwable cause) {
        super(message, cause);
    }
}
