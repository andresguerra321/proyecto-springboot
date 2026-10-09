package com.campus.rentaequipos.identity.infrastructure.adapter.out.persistence;

import com.campus.rentaequipos.identity.domain.model.Role;
import com.campus.rentaequipos.identity.domain.model.User;
import com.campus.rentaequipos.identity.domain.repository.UserRepository;
import com.campus.rentaequipos.identity.infrastructure.adapter.out.persistence.entity.RoleJpaEntity;
import com.campus.rentaequipos.identity.infrastructure.adapter.out.persistence.entity.UserJpaEntity;
import com.campus.rentaequipos.identity.infrastructure.adapter.out.persistence.repository.SpringDataRoleRepository;
import com.campus.rentaequipos.identity.infrastructure.adapter.out.persistence.repository.SpringDataUserRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class UserRepositoryAdapter implements UserRepository {

    private final SpringDataUserRepository userRepository;
    private final SpringDataRoleRepository roleRepository;

    public UserRepositoryAdapter(SpringDataUserRepository userRepository, SpringDataRoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @Override
    public Optional<User> findById(UUID id) {
        return userRepository.findById(id).map(UserJpaEntity::toDomain);
    }

    @Override
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username).map(UserJpaEntity::toDomain);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email).map(UserJpaEntity::toDomain);
    }

    @Override
    public User save(User user) {
        Set<RoleJpaEntity> roleEntities = user.getRoles().stream()
                .map(role -> roleRepository.findByName(role)
                        .orElseGet(() -> roleRepository.save(new RoleJpaEntity(role))))
                .collect(Collectors.toSet());

        UserJpaEntity entity = UserJpaEntity.fromDomain(user, roleEntities);
        return userRepository.save(entity).toDomain();
    }

    @Override
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }
}
