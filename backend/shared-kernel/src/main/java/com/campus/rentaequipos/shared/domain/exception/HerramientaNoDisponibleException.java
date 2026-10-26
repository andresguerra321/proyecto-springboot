package com.campus.rentaequipos.shared.domain.exception;

public class HerramientaNoDisponibleException extends DomainException {
    public HerramientaNoDisponibleException(String message) {
        super(message);
    }

    public HerramientaNoDisponibleException(String toolName, String reason) {
        super("La herramienta '" + toolName + "' no está disponible: " + reason);
    }
}
