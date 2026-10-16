package com.campus.rentaequipos.identity.infrastructure.adapter.out.persistence.repository;

import com.campus.rentaequipos.identity.infrastructure.adapter.out.persistence.entity.NotificationJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface SpringDataNotificationRepository extends JpaRepository<NotificationJpaEntity, UUID> {
    List<NotificationJpaEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);
    long countByUserIdAndReadFalse(UUID userId);

    @Modifying
    @Query("UPDATE NotificationJpaEntity n SET n.read = true, n.readAt = CURRENT_TIMESTAMP WHERE n.userId = :userId AND n.read = false")
    void markAllAsReadByUserId(@Param("userId") UUID userId);

    @Modifying
    @Query("DELETE FROM NotificationJpaEntity n WHERE n.id = :id AND n.userId = :userId")
    void deleteByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);
}
