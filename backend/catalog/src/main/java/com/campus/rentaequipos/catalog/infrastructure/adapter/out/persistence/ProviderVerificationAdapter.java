package com.campus.rentaequipos.catalog.infrastructure.adapter.out.persistence;

import com.campus.rentaequipos.catalog.domain.repository.ProviderVerificationPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class ProviderVerificationAdapter implements ProviderVerificationPort {

    private final JdbcTemplate jdbcTemplate;

    public ProviderVerificationAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public boolean isProviderVerified(UUID providerId) {
        Boolean verified = jdbcTemplate.query(
                "SELECT is_verified FROM provider_profiles WHERE id = ?",
                rs -> rs.next() ? rs.getBoolean("is_verified") : null,
                providerId);
        return Boolean.TRUE.equals(verified);
    }
}
