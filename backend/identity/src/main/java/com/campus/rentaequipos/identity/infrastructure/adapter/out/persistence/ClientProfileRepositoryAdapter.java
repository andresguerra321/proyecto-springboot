package com.campus.rentaequipos.identity.infrastructure.adapter.out.persistence;

import com.campus.rentaequipos.identity.domain.model.ClientProfile;
import com.campus.rentaequipos.identity.domain.repository.ClientProfileRepository;
import com.campus.rentaequipos.identity.infrastructure.adapter.out.persistence.entity.ClientProfileJpaEntity;
import com.campus.rentaequipos.identity.infrastructure.adapter.out.persistence.repository.SpringDataClientProfileRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class ClientProfileRepositoryAdapter implements ClientProfileRepository {

    private final SpringDataClientProfileRepository repository;

    public ClientProfileRepositoryAdapter(SpringDataClientProfileRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<ClientProfile> findById(UUID id) {
        return repository.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<ClientProfile> findByUserId(UUID userId) {
        return repository.findByUserId(userId).map(this::toDomain);
    }

    @Override
    public boolean existsByDocumentNumber(String documentNumber) {
        return repository.existsByDocumentNumber(documentNumber);
    }

    @Override
    public List<ClientProfile> findAll() {
        return repository.findAll().stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public ClientProfile save(ClientProfile profile) {
        ClientProfileJpaEntity entity = toEntity(profile);
        ClientProfileJpaEntity saved = repository.save(entity);
        return toDomain(saved);
    }

    @Override
    public void deleteById(UUID id) {
        repository.deleteById(id);
    }

    private ClientProfile toDomain(ClientProfileJpaEntity entity) {
        return new ClientProfile(
                entity.getId(),
                entity.getUserId(),
                entity.getFullName(),
                entity.getDocumentType(),
                entity.getDocumentNumber(),
                entity.getPhone(),
                entity.getAddress(),
                entity.getCity(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private ClientProfileJpaEntity toEntity(ClientProfile domain) {
        return new ClientProfileJpaEntity(
                domain.getId(),
                domain.getUserId(),
                domain.getFullName(),
                domain.getDocumentType(),
                domain.getDocumentNumber(),
                domain.getPhone(),
                domain.getAddress(),
                domain.getCity(),
                domain.getCreatedAt(),
                domain.getUpdatedAt()
        );
    }
}
