package com.campus.rentaequipos.identity.domain.repository;

import com.campus.rentaequipos.identity.domain.model.ClientProfile;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClientProfileRepository {
    Optional<ClientProfile> findById(UUID id);
    Optional<ClientProfile> findByUserId(UUID userId);
    boolean existsByDocumentNumber(String documentNumber);
    List<ClientProfile> findAll();
    ClientProfile save(ClientProfile profile);
    void deleteById(UUID id);
}
