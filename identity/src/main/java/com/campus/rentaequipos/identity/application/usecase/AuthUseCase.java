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
                .orElseThrow(() -> new EntityNotFoundException("User", request.username()));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BusinessRuleViolationException("Invalid credentials");
        }
        if (!user.isEnabled()) {
            throw new BusinessRuleViolationException("Account is disabled");
        }

        String token = jwtTokenPort.generateToken(user);
        return new AuthResponse(token, "Bearer", user.getUsername());
    }
}
