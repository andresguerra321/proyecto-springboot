package com.campus.rentaequipos.shared.domain.exception;

/**
 * Excepción lanzada cuando una entidad requerida no existe en el sistema.
 */
public class EntityNotFoundException extends DomainException {

    public EntityNotFoundException(String message) {
        super(message);
    }

    public EntityNotFoundException(String entityName, Object id) {
        super(String.format("%s con identificador '%s' no fue encontrado", entityName, id));
    }
}
