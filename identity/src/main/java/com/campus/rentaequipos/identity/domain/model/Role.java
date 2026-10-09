package com.campus.rentaequipos.identity.domain.model;

/**
 * Roles del sistema según especificación de requerimientos.
 */
public enum Role {
    ROLE_ADMIN,
    ROLE_PROVEEDOR,
    ROLE_CLIENTE;

    public String getAuthority() {
        return name();
    }
}
