package com.campus.rentaequipos.identity.domain.repository;

import com.campus.rentaequipos.identity.domain.model.User;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository {
    Optional<User> findById(UUID id);
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    java.util.List<User> findAll();
    User save(User user);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}
