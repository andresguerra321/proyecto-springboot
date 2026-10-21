package com.campus.rentaequipos.identity.infrastructure.adapter.out.persistence.repository;

import com.campus.rentaequipos.identity.infrastructure.adapter.out.persistence.entity.UserJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface SpringDataUserRepository extends JpaRepository<UserJpaEntity, UUID> {
    Optional<UserJpaEntity> findByUsername(String username);
    Optional<UserJpaEntity> findByEmail(String email);
    Optional<UserJpaEntity> findByUsernameIgnoreCase(String username);
    Optional<UserJpaEntity> findByEmailIgnoreCase(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}
