package com.campus.rentaequipos.identity.infrastructure.adapter.out.persistence.repository;

import com.campus.rentaequipos.identity.domain.model.Role;
import com.campus.rentaequipos.identity.infrastructure.adapter.out.persistence.entity.RoleJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SpringDataRoleRepository extends JpaRepository<RoleJpaEntity, Integer> {
    Optional<RoleJpaEntity> findByName(Role name);
}
