package com.campus.rentaequipos.identity.infrastructure.adapter.out.persistence;

import com.campus.rentaequipos.identity.domain.model.ProviderProfile;
import com.campus.rentaequipos.identity.domain.repository.ProviderProfileRepository;
import com.campus.rentaequipos.identity.infrastructure.adapter.out.persistence.entity.ProviderProfileJpaEntity;
import com.campus.rentaequipos.identity.infrastructure.adapter.out.persistence.repository.SpringDataProviderProfileRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class ProviderProfileRepositoryAdapter implements ProviderProfileRepository {

    private final SpringDataProviderProfileRepository repository;

    public ProviderProfileRepositoryAdapter(SpringDataProviderProfileRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<ProviderProfile> findById(UUID id) {
        return repository.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<ProviderProfile> findByUserId(UUID userId) {
        return repository.findByUserId(userId).map(this::toDomain);
    }

    @Override
    public boolean existsByTaxId(String taxId) {
        return repository.existsByTaxId(taxId);
    }

    @Override
    public List<ProviderProfile> findAll() {
        return repository.findAll().stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public ProviderProfile save(ProviderProfile profile) {
        ProviderProfileJpaEntity entity = toEntity(profile);
        ProviderProfileJpaEntity saved = repository.save(entity);
        return toDomain(saved);
    }

    @Override
    public void deleteById(UUID id) {
        repository.deleteById(id);
    }

    private ProviderProfile toDomain(ProviderProfileJpaEntity entity) {
        return new ProviderProfile(
                entity.getId(),
                entity.getUserId(),
                entity.getCompanyName(),
                entity.getTaxId(),
                entity.getPhone(),
                entity.getAddress(),
                entity.getCity(),
                entity.isVerified(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private ProviderProfileJpaEntity toEntity(ProviderProfile domain) {
        return new ProviderProfileJpaEntity(
                domain.getId(),
                domain.getUserId(),
                domain.getCompanyName(),
                domain.getTaxId(),
                domain.getPhone(),
                domain.getAddress(),
                domain.getCity(),
                domain.isVerified(),
                domain.getCreatedAt(),
                domain.getUpdatedAt()
        );
    }
}
