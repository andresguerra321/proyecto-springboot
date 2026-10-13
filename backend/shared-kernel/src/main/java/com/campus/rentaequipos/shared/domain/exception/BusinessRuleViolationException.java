package com.campus.rentaequipos.shared.domain.exception;

/**
 * Excepción lanzada cuando se intenta ejecutar una operación que viola las reglas de negocio.
 */
public class BusinessRuleViolationException extends DomainException {

    public BusinessRuleViolationException(String message) {
        super(message);
    }
}
