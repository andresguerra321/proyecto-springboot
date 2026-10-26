package com.campus.rentaequipos.catalog.infrastructure.security;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Guardia de propiedad (Anti-IDOR / Broken Object Level Authorization) para recursos de proveedores.
 * Garantiza que un PROVEEDOR solo pueda operar sobre sus propias herramientas.
 * Los usuarios con ROLE_ADMIN quedan exentos.
 */
@Component
public class ProviderOwnershipGuard {

    private final JdbcTemplate jdbcTemplate;

    public ProviderOwnershipGuard(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public boolean isAdmin(UserDetails user) {
        return user != null && user.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()) || "ADMIN".equals(a.getAuthority()));
    }

    /** Devuelve provider_profiles.id del usuario autenticado, o null si no tiene perfil de proveedor. */
    public UUID findOwnProviderId(UserDetails user) {
        if (user == null) return null;
        return jdbcTemplate.query(
                "SELECT p.id FROM provider_profiles p JOIN users u ON p.user_id = u.id WHERE u.username = ?",
                rs -> rs.next() ? (UUID) rs.getObject("id") : null,
                user.getUsername());
    }

    /** Lanza 403 si el usuario no es ADMIN y la herramienta no pertenece a su perfil de proveedor. */
    public void assertOwnsTool(UUID toolId, UserDetails user) {
        if (isAdmin(user)) return;
        UUID ownProviderId = findOwnProviderId(user);
        UUID toolProviderId = jdbcTemplate.query(
                "SELECT provider_id FROM tools WHERE id = ?",
                rs -> rs.next() ? (UUID) rs.getObject("provider_id") : null,
                toolId);
        if (toolProviderId == null) {
            return; // inexistente: el caso de uso responderá 404
        }
        if (ownProviderId == null || !ownProviderId.equals(toolProviderId)) {
            throw new AccessDeniedException("Acceso denegado: la herramienta pertenece a otro proveedor");
        }
    }

    /** Lanza 403 si el usuario no es ADMIN y ninguna herramienta del alquiler pertenece a su perfil. */
    public void assertProviderOwnsRental(UUID rentalId, UserDetails user) {
        if (isAdmin(user)) return;
        UUID ownProviderId = findOwnProviderId(user);
        Integer count = ownProviderId == null ? 0 : jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM rental_items ri JOIN tools t ON ri.tool_id = t.id " +
                "WHERE ri.rental_id = ? AND t.provider_id = ?",
                Integer.class, rentalId, ownProviderId);
        if (count == null || count == 0) {
            throw new AccessDeniedException("Acceso denegado: este alquiler no incluye equipos de su empresa");
        }
    }

    /** true si el usuario autenticado es el cliente dueño del alquiler. */
    public boolean isClientOwnerOfRental(UUID rentalId, UserDetails user) {
        if (user == null) return false;
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM rentals r JOIN client_profiles c ON r.client_id = c.id " +
                "JOIN users u ON c.user_id = u.id WHERE r.id = ? AND u.username = ?",
                Integer.class, rentalId, user.getUsername());
        return count != null && count > 0;
    }

    /** true si el usuario es proveedor de alguno de los equipos del alquiler. */
    public boolean isProviderOfRental(UUID rentalId, UserDetails user) {
        UUID ownProviderId = findOwnProviderId(user);
        if (ownProviderId == null) return false;
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM rental_items ri JOIN tools t ON ri.tool_id = t.id " +
                "WHERE ri.rental_id = ? AND t.provider_id = ?",
                Integer.class, rentalId, ownProviderId);
        return count != null && count > 0;
    }
}
