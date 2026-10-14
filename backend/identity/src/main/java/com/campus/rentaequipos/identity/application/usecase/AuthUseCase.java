package com.campus.rentaequipos.identity.application.usecase;

import com.campus.rentaequipos.identity.application.dto.AuthResponse;
import com.campus.rentaequipos.identity.application.dto.LoginRequest;
import com.campus.rentaequipos.identity.application.dto.RegisterRequest;
import com.campus.rentaequipos.identity.domain.model.ClientProfile;
import com.campus.rentaequipos.identity.domain.model.ProviderProfile;
import com.campus.rentaequipos.identity.domain.model.Role;
import com.campus.rentaequipos.identity.domain.model.User;
import com.campus.rentaequipos.identity.domain.port.JwtTokenPort;
import com.campus.rentaequipos.identity.domain.port.PasswordEncoderPort;
import com.campus.rentaequipos.identity.domain.repository.ClientProfileRepository;
import com.campus.rentaequipos.identity.domain.repository.ProviderProfileRepository;
import com.campus.rentaequipos.identity.domain.repository.UserRepository;
import com.campus.rentaequipos.shared.domain.exception.BusinessRuleViolationException;
import com.campus.rentaequipos.shared.domain.exception.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuthUseCase {

    private final UserRepository userRepository;
    private final PasswordEncoderPort passwordEncoder;
    private final JwtTokenPort jwtTokenPort;
    private final ClientProfileRepository clientProfileRepository;
    private final ProviderProfileRepository providerProfileRepository;

    public AuthUseCase(UserRepository userRepository,
                       PasswordEncoderPort passwordEncoder,
                       JwtTokenPort jwtTokenPort,
                       ClientProfileRepository clientProfileRepository,
                       ProviderProfileRepository providerProfileRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenPort = jwtTokenPort;
        this.clientProfileRepository = clientProfileRepository;
        this.providerProfileRepository = providerProfileRepository;
    }


    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new BusinessRuleViolationException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessRuleViolationException("Email is already taken");
        }

        Set<Role> roles = request.roles() != null ? request.roles().stream()
                .filter(r -> r != null && !r.isBlank())
                .map(roleStr -> {
                    String clean = roleStr.trim().toUpperCase();
                    if (!clean.startsWith("ROLE_")) {
                        clean = "ROLE_" + clean;
                    }
                    try {
                        return Role.valueOf(clean);
                    } catch (IllegalArgumentException e) {
                        throw new BusinessRuleViolationException("Invalid role: " + roleStr);
                    }
                })
                .collect(Collectors.toSet()) : new java.util.HashSet<>();

        if (roles.isEmpty()) {
            roles = Set.of(Role.ROLE_CLIENTE);
        }

        // Mitigación de Escalada de Privilegios en Registro Público:
        // Las peticiones no autenticadas solo pueden crear cuentas con ROLE_CLIENTE o ROLE_PROVEEDOR.
        // La asignación de cualquier otro rol (ej. ROLE_ADMIN) requiere que la sesión actual posea privilegios de ADMIN.
        boolean containsPrivilegedRole = roles.stream().anyMatch(r -> r != Role.ROLE_CLIENTE && r != Role.ROLE_PROVEEDOR);
        if (containsPrivilegedRole) {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            boolean isCurrentAdmin = auth != null && auth.isAuthenticated() &&
                    auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            if (!isCurrentAdmin) {
                throw new BusinessRuleViolationException("El registro público no permite la asignación de roles administrativos. Solo se admiten ROLE_CLIENTE o ROLE_PROVEEDOR.");
            }
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

        // Crear automáticamente el perfil comercial según el rol (Garantiza integridad relacional 100%)
        if (roles.contains(Role.ROLE_PROVEEDOR)) {
            String compName = (request.companyName() != null && !request.companyName().isBlank())
                    ? request.companyName()
                    : ((request.fullName() != null && !request.fullName().isBlank()) ? request.fullName() : request.username() + " Equipos");
            String taxId = (request.taxId() != null && !request.taxId().isBlank())
                    ? request.taxId()
                    : "NIT-" + (100000000L + Math.abs(newUser.getId().getLeastSignificantBits() % 900000000L)) + "-1";
            String phone = (request.phone() != null && !request.phone().isBlank()) ? request.phone() : "3001234567";
            String address = (request.address() != null && !request.address().isBlank()) ? request.address() : "Bogotá D.C.";
            String city = (request.city() != null && !request.city().isBlank()) ? request.city() : "Bogotá";

            ProviderProfile providerProfile = new ProviderProfile(
                    UUID.randomUUID(),
                    newUser.getId(),
                    compName,
                    taxId,
                    phone,
                    address,
                    city,
                    false,
                    LocalDateTime.now(),
                    LocalDateTime.now()
            );
            providerProfileRepository.save(providerProfile);
        } else {
            // ROLE_CLIENTE o cualquier otro rol de usuario
            String fullName = (request.fullName() != null && !request.fullName().isBlank())
                    ? request.fullName()
                    : request.username();
            String docType = (request.documentType() != null && !request.documentType().isBlank())
                    ? request.documentType()
                    : "CC";
            String docNumber = (request.documentNumber() != null && !request.documentNumber().isBlank())
                    ? request.documentNumber()
                    : "CLI-" + (1000000000L + Math.abs(newUser.getId().getLeastSignificantBits() % 9000000000L));
            String phone = (request.phone() != null && !request.phone().isBlank()) ? request.phone() : "3001234567";
            String address = (request.address() != null && !request.address().isBlank()) ? request.address() : "Bogotá D.C.";
            String city = (request.city() != null && !request.city().isBlank()) ? request.city() : "Bogotá";

            ClientProfile clientProfile = new ClientProfile(
                    UUID.randomUUID(),
                    newUser.getId(),
                    fullName,
                    docType,
                    docNumber,
                    phone,
                    address,
                    city,
                    LocalDateTime.now(),
                    LocalDateTime.now()
            );
            clientProfileRepository.save(clientProfile);
        }

        String token = jwtTokenPort.generateToken(newUser);
        return new AuthResponse(token, "Bearer", newUser.getUsername());
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String identifier = request.username() != null ? request.username().trim() : "";
        User user = userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier))
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
        String identifier = username != null ? username.trim() : "";
        User user = userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier))
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

    /**
     * Actualiza correo y roles de un usuario (solo ADMIN).
     * Un administrador no puede quitarse a sí mismo el rol ADMIN (evita bloqueo de la plataforma).
     */
    @Transactional
    public com.campus.rentaequipos.identity.application.dto.UserResponse updateUser(
            UUID id, com.campus.rentaequipos.identity.application.dto.UpdateUserRequest request, String currentUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User", id));

        String newEmail = request.email().trim().toLowerCase();
        userRepository.findByEmail(newEmail).ifPresent(other -> {
            if (!other.getId().equals(id)) {
                throw new BusinessRuleViolationException("El correo " + newEmail + " ya está registrado por otro usuario");
            }
        });

        Set<Role> newRoles = request.roles().stream().map(r -> {
            try {
                return Role.valueOf(r.startsWith("ROLE_") ? r : "ROLE_" + r);
            } catch (IllegalArgumentException e) {
                throw new BusinessRuleViolationException("Rol inválido: " + r);
            }
        }).collect(Collectors.toSet());

        if (user.getUsername().equals(currentUsername) && !newRoles.contains(Role.ROLE_ADMIN)) {
            throw new BusinessRuleViolationException("No puede retirarse a sí mismo el rol de Administrador");
        }

        user.changeEmail(newEmail);
        user.changeRoles(newRoles);
        return mapToUserResponse(userRepository.save(user));
    }

    /**
     * Activa o desactiva el acceso de un usuario (borrado lógico).
     * Se usa borrado lógico porque users está referenciado por perfiles, alquileres y facturas (ON DELETE RESTRICT).
     */
    @Transactional
    public com.campus.rentaequipos.identity.application.dto.UserResponse setUserEnabled(UUID id, boolean enabled, String currentUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User", id));
        if (!enabled && user.getUsername().equals(currentUsername)) {
            throw new BusinessRuleViolationException("No puede desactivar su propia cuenta de administrador");
        }
        user.setEnabled(enabled);
        return mapToUserResponse(userRepository.save(user));
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
