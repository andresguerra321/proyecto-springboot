package com.campus.rentaequipos.identity.application.usecase;

import com.campus.rentaequipos.identity.application.dto.AuthResponse;
import com.campus.rentaequipos.identity.application.dto.LoginRequest;
import com.campus.rentaequipos.identity.application.dto.RegisterRequest;
import com.campus.rentaequipos.identity.domain.model.Role;
import com.campus.rentaequipos.identity.domain.model.User;
import com.campus.rentaequipos.identity.domain.port.JwtTokenPort;
import com.campus.rentaequipos.identity.domain.port.PasswordEncoderPort;
import com.campus.rentaequipos.identity.domain.repository.UserRepository;
import com.campus.rentaequipos.shared.domain.exception.BusinessRuleViolationException;
import com.campus.rentaequipos.shared.domain.exception.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuthUseCase {

    private final UserRepository userRepository;
    private final PasswordEncoderPort passwordEncoder;
    private final JwtTokenPort jwtTokenPort;

    public AuthUseCase(UserRepository userRepository, PasswordEncoderPort passwordEncoder, JwtTokenPort jwtTokenPort) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenPort = jwtTokenPort;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new BusinessRuleViolationException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessRuleViolationException("Email is already taken");
        }

        Set<Role> roles = request.roles().stream()
                .map(roleStr -> {
                    try {
                        return Role.valueOf(roleStr);
                    } catch (IllegalArgumentException e) {
                        throw new BusinessRuleViolationException("Invalid role: " + roleStr);
                    }
                })
                .collect(Collectors.toSet());

        if (roles.isEmpty()) {
            roles = Set.of(Role.ROLE_CLIENTE);
        }

        User newUser = new User(
                UUID.randomUUID(),
                request.username(),
                request.email(),
                passwordEncoder.encode(request.password()),
                true,
                roles
        );

        userRepository.save(newUser);
        String token = jwtTokenPort.generateToken(newUser);
        return new AuthResponse(token, "Bearer", newUser.getUsername());
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new BusinessRuleViolationException("Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BusinessRuleViolationException("Invalid credentials");
        }
        if (!user.isEnabled()) {
            throw new BusinessRuleViolationException("Account is disabled");
        }

        String token = jwtTokenPort.generateToken(user);
        return new AuthResponse(token, "Bearer", user.getUsername());
    }

    @Transactional(readOnly = true)
    public com.campus.rentaequipos.identity.application.dto.UserResponse getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User", username));
        return mapToUserResponse(user);
    }

    @Transactional(readOnly = true)
    public com.campus.rentaequipos.identity.application.dto.UserResponse getUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User", id));
        return mapToUserResponse(user);
    }

    @Transactional(readOnly = true)
    public java.util.List<com.campus.rentaequipos.identity.application.dto.UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    private com.campus.rentaequipos.identity.application.dto.UserResponse mapToUserResponse(User user) {
        return new com.campus.rentaequipos.identity.application.dto.UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.isEnabled(),
                user.getRoles().stream().map(Role::name).collect(Collectors.toSet())
        );
    }
}
