package com.campus.rentaequipos.catalog.domain.repository;

import java.util.UUID;

/** Puerto de salida: consulta si un proveedor fue verificado por un administrador. */
public interface ProviderVerificationPort {
    boolean isProviderVerified(UUID providerId);
}
