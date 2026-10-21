package com.campus.rentaequipos.identity.application.usecase;

import com.campus.rentaequipos.identity.application.dto.AuthResponse;
import com.campus.rentaequipos.identity.application.dto.LoginRequest;
import com.campus.rentaequipos.identity.application.dto.RegisterRequest;
import com.campus.rentaequipos.identity.application.dto.VerifySessionResponse;
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
import org.springframework.jdbc.core.JdbcTemplate;
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
    private final JdbcTemplate jdbcTemplate;

    public AuthUseCase(UserRepository userRepository,
                       PasswordEncoderPort passwordEncoder,
                       JwtTokenPort jwtTokenPort,
                       ClientProfileRepository clientProfileRepository,
                       ProviderProfileRepository providerProfileRepository,
                       JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenPort = jwtTokenPort;
        this.clientProfileRepository = clientProfileRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.jdbcTemplate = jdbcTemplate;
    }


    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Validación de seguridad e inyección de datos
        validateFieldSafety("nombre de usuario", request.username());
        validateFieldSafety("correo electrónico", request.email());
        validateFieldSafety("nombre", request.fullName());
        validateFieldSafety("razón social", request.companyName());
        validateFieldSafety("teléfono", request.phone());
        validateFieldSafety("documento", request.documentNumber());
        validateFieldSafety("NIT/RUT", request.taxId());
        validateFieldSafety("ciudad", request.city());

        String cleanUsername = request.username() != null ? request.username().trim() : "";
        String cleanEmail = request.email() != null ? request.email().trim().toLowerCase() : "";

        if (userRepository.existsByUsername(cleanUsername)) {
            throw new BusinessRuleViolationException("El nombre de usuario ya está en uso. Por favor elige otro.");
        }
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new BusinessRuleViolationException("El correo electrónico ya está registrado. Si ya tienes cuenta, inicia sesión.");
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
                cleanUsername,
                cleanEmail,
                passwordEncoder.encode(request.password()),
                true,
                roles
        );

        userRepository.save(newUser);

        // Crear automáticamente el perfil comercial según el rol (Garantiza integridad relacional 100%)
        if (roles.contains(Role.ROLE_PROVEEDOR)) {
            String compName = (request.companyName() != null && !request.companyName().isBlank())
                    ? request.companyName().trim()
                    : ((request.fullName() != null && !request.fullName().isBlank()) ? request.fullName().trim() : cleanUsername + " Equipos");
            
            if (compName.length() < 3 || compName.replaceAll("[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ]", "").length() < 3) {
                throw new BusinessRuleViolationException("La razón social debe contener al menos 3 caracteres alfanuméricos legibles (no puede ser solo puntos o símbolos).");
            }

            String taxId = (request.taxId() != null && !request.taxId().isBlank())
                    ? request.taxId().trim()
                    : "NIT-" + (100000000L + Math.abs(newUser.getId().getLeastSignificantBits() % 900000000L)) + "-1";
            
            if (request.taxId() != null && !request.taxId().isBlank()) {
                String t = request.taxId().trim();
                if (!t.matches("^\\d{8,10}(-\\d)?$")) {
                    throw new BusinessRuleViolationException("El NIT o RUT debe tener entre 8 y 10 dígitos numéricos (con dígito de verificación opcional, ej. 901234567-8).");
                }
            }

            if (providerProfileRepository.existsByTaxId(taxId)) {
                throw new BusinessRuleViolationException("El NIT o RUT ya se encuentra registrado por otro proveedor.");
            }

            if (request.phone() != null && !request.phone().isBlank()) {
                String p = request.phone().trim();
                if (!p.matches("^\\d{10}$")) {
                    throw new BusinessRuleViolationException("El número de teléfono debe contener exactamente 10 dígitos numéricos (ej. 3001234567).");
                }
            }

            String phone = (request.phone() != null && !request.phone().isBlank()) ? request.phone().trim() : "3001234567";

            if (request.city() != null && !request.city().isBlank()) {
                String c = request.city().trim();
                if (!c.matches("^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\\s]{3,40}$") || c.replaceAll("[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]", "").length() < 3) {
                    throw new BusinessRuleViolationException("La ciudad solo puede contener letras y espacios (entre 3 y 40 caracteres, ej. Bogotá).");
                }
            }
            String city = (request.city() != null && !request.city().isBlank()) ? request.city().trim() : "Bogotá";

            if (request.address() != null && !request.address().isBlank()) {
                String a = request.address().trim();
                if (a.length() < 5 || a.length() > 100 || a.replaceAll("[^a-zA-Z0-9]", "").length() < 4) {
                    throw new BusinessRuleViolationException("La dirección debe tener un formato válido de al menos 5 caracteres (ej. Calle 100 # 15-20).");
                }
            }
            String address = (request.address() != null && !request.address().isBlank()) ? request.address().trim() : "Bogotá D.C.";

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
                    ? request.fullName().trim()
                    : cleanUsername;

            if (fullName.length() < 3 || fullName.replaceAll("[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ]", "").length() < 3) {
                throw new BusinessRuleViolationException("El nombre del cliente debe contener al menos 3 caracteres alfanuméricos legibles (no puede ser solo puntos o símbolos).");
            }

            String docType = (request.documentType() != null && !request.documentType().isBlank())
                    ? request.documentType().trim()
                    : "CC";
            String docNumber = (request.documentNumber() != null && !request.documentNumber().isBlank())
                    ? request.documentNumber().trim()
                    : "CLI-" + (1000000000L + Math.abs(newUser.getId().getLeastSignificantBits() % 9000000000L));

            if (request.documentNumber() != null && !request.documentNumber().isBlank()) {
                String d = request.documentNumber().trim();
                if (!d.matches("^\\d{6,10}$")) {
                    throw new BusinessRuleViolationException("El documento de identidad debe contener entre 6 y 10 dígitos numéricos.");
                }
            }

            if (clientProfileRepository.existsByDocumentNumber(docNumber)) {
                throw new BusinessRuleViolationException("El número de documento de identidad ya se encuentra registrado por otro cliente.");
            }

            if (request.phone() != null && !request.phone().isBlank()) {
                String p = request.phone().trim();
                if (!p.matches("^\\d{10}$")) {
                    throw new BusinessRuleViolationException("El número de teléfono debe contener exactamente 10 dígitos numéricos (ej. 3001234567).");
                }
            }

            String phone = (request.phone() != null && !request.phone().isBlank()) ? request.phone().trim() : "3001234567";

            if (request.city() != null && !request.city().isBlank()) {
                String c = request.city().trim();
                if (!c.matches("^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\\s]{3,40}$") || c.replaceAll("[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]", "").length() < 3) {
                    throw new BusinessRuleViolationException("La ciudad solo puede contener letras y espacios (entre 3 y 40 caracteres, ej. Bogotá).");
                }
            }
            String city = (request.city() != null && !request.city().isBlank()) ? request.city().trim() : "Bogotá";

            if (request.address() != null && !request.address().isBlank()) {
                String a = request.address().trim();
                if (a.length() < 5 || a.length() > 100 || a.replaceAll("[^a-zA-Z0-9]", "").length() < 4) {
                    throw new BusinessRuleViolationException("La dirección debe tener un formato válido de al menos 5 caracteres (ej. Calle 100 # 15-20).");
                }
            }
            String address = (request.address() != null && !request.address().isBlank()) ? request.address().trim() : "Bogotá D.C.";

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

    private void validateFieldSafety(String fieldName, String value) {
        if (value == null || value.isBlank()) return;
        String lower = value.toLowerCase();
        if (lower.contains("<script") || lower.contains("javascript:") || lower.contains("onerror=") ||
            lower.contains("onload=") || lower.contains("<iframe") || lower.contains("union select") ||
            lower.contains("xp_") || lower.contains("exec(") || lower.contains("execute(") ||
            lower.contains("--") || lower.contains("/*") || lower.contains("*/") || lower.contains(";--")) {
            throw new BusinessRuleViolationException("El campo " + fieldName + " contiene caracteres o secuencias no permitidas.");
        }
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String identifier = request.username() != null ? request.username().trim() : "";
        User user = userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier))
                .or(() -> userRepository.findByUsernameIgnoreCase(identifier))
                .or(() -> userRepository.findByEmailIgnoreCase(identifier))
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
                .or(() -> userRepository.findByUsernameIgnoreCase(identifier))
                .or(() -> userRepository.findByEmailIgnoreCase(identifier))
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

    /**
     * Verificación de sesión en tiempo real mediante una única consulta de proyección SQL.
     * Valida existencia y estado activo del usuario, extrayendo id, nombre, email y rol
     * optimizando las consultas a base de datos.
     */
    @Transactional(readOnly = true)
    public VerifySessionResponse verifySession(String username) {
        if (username == null || username.isBlank()) {
            throw new EntityNotFoundException("Sesión inválida: identificador de usuario no proporcionado");
        }

        String sql = """
            SELECT 
                u.id AS id,
                u.username AS username,
                u.email AS email,
                COALESCE(c.full_name, p.company_name, u.username) AS nombre,
                COALESCE(r.name, 'ROLE_CLIENTE') AS rol
            FROM users u
            LEFT JOIN client_profiles c ON c.user_id = u.id
            LEFT JOIN provider_profiles p ON p.user_id = u.id
            LEFT JOIN user_roles ur ON ur.user_id = u.id
            LEFT JOIN roles r ON r.id = ur.role_id
            WHERE (u.username = ? OR u.email = ?) AND u.enabled = true
            ORDER BY (CASE WHEN r.name = 'ROLE_ADMIN' THEN 1 WHEN r.name = 'ROLE_PROVEEDOR' THEN 2 ELSE 3 END)
            LIMIT 1
        """;

        java.util.List<VerifySessionResponse> results = jdbcTemplate.query(
            sql,
            (rs, rowNum) -> {
                Object idObj = rs.getObject("id");
                UUID id = idObj instanceof UUID ? (UUID) idObj : UUID.fromString(idObj.toString());
                String uname = rs.getString("username");
                String email = rs.getString("email");
                String nombre = rs.getString("nombre");
                String rawRole = rs.getString("rol");
                String cleanRole = rawRole != null ? rawRole.replace("ROLE_", "").trim() : "CLIENTE";
                return new VerifySessionResponse(id, nombre, email, cleanRole, uname);
            },
            username.trim(),
            username.trim()
        );

        if (results.isEmpty()) {
            throw new EntityNotFoundException("Usuario no encontrado o cuenta inactiva");
        }

        return results.get(0);
    }
}
