package com.campus.rentaequipos.identity.domain.repository;

import com.campus.rentaequipos.identity.domain.model.ProviderProfile;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProviderProfileRepository {
    Optional<ProviderProfile> findById(UUID id);
    Optional<ProviderProfile> findByUserId(UUID userId);
    boolean existsByTaxId(String taxId);
    List<ProviderProfile> findAll();
    ProviderProfile save(ProviderProfile profile);
    void deleteById(UUID id);
}
