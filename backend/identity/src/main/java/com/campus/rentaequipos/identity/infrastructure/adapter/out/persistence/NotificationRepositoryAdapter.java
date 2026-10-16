package com.campus.rentaequipos.identity.infrastructure.adapter.out.persistence;

import com.campus.rentaequipos.identity.domain.model.Notification;
import com.campus.rentaequipos.identity.domain.repository.NotificationRepository;
import com.campus.rentaequipos.identity.infrastructure.adapter.out.persistence.entity.NotificationJpaEntity;
import com.campus.rentaequipos.identity.infrastructure.adapter.out.persistence.repository.SpringDataNotificationRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class NotificationRepositoryAdapter implements NotificationRepository {

    private final SpringDataNotificationRepository repository;

    public NotificationRepositoryAdapter(SpringDataNotificationRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional
    public Notification save(Notification notification) {
        NotificationJpaEntity entity = NotificationJpaEntity.fromDomain(notification);
        NotificationJpaEntity saved = repository.save(entity);
        return saved.toDomain();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Notification> findById(UUID id) {
        return repository.findById(id).map(NotificationJpaEntity::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationJpaEntity::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public long countByUserIdAndReadFalse(UUID userId) {
        return repository.countByUserIdAndReadFalse(userId);
    }

    @Override
    @Transactional
    public void markAllAsReadByUserId(UUID userId) {
        repository.markAllAsReadByUserId(userId);
    }

    @Override
    @Transactional
    public void deleteByIdAndUserId(UUID id, UUID userId) {
        repository.deleteByIdAndUserId(id, userId);
    }
}
