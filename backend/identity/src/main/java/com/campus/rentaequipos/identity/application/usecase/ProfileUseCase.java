package com.campus.rentaequipos.identity.application.usecase;

import com.campus.rentaequipos.identity.application.dto.ClientProfileRequest;
import com.campus.rentaequipos.identity.application.dto.ClientProfileResponse;
import com.campus.rentaequipos.identity.application.dto.ProviderProfileRequest;
import com.campus.rentaequipos.identity.application.dto.ProviderProfileResponse;
import com.campus.rentaequipos.identity.domain.model.ClientProfile;
import com.campus.rentaequipos.identity.domain.model.ProviderProfile;
import com.campus.rentaequipos.identity.domain.model.User;
import com.campus.rentaequipos.identity.domain.repository.ClientProfileRepository;
import com.campus.rentaequipos.identity.domain.repository.ProviderProfileRepository;
import com.campus.rentaequipos.identity.domain.repository.UserRepository;
import com.campus.rentaequipos.shared.domain.exception.BusinessRuleViolationException;
import com.campus.rentaequipos.shared.domain.exception.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProfileUseCase {

    private final ClientProfileRepository clientProfileRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final UserRepository userRepository;

    public ProfileUseCase(ClientProfileRepository clientProfileRepository,
                          ProviderProfileRepository providerProfileRepository,
                          UserRepository userRepository) {
        this.clientProfileRepository = clientProfileRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.userRepository = userRepository;
    }

    // ---------------------------------------------------------
    // CLIENT PROFILE OPERATIONS
    // ---------------------------------------------------------

    @Transactional
    public ClientProfileResponse createClientProfile(ClientProfileRequest request) {
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new EntityNotFoundException("User", request.userId()));

        if (clientProfileRepository.findByUserId(user.getId()).isPresent()) {
            throw new BusinessRuleViolationException("El perfil de cliente ya existe para este usuario.");
        }

        validateProfileFields(request.fullName(), request.phone(), request.address(), request.city(), false);

        ClientProfile profile = new ClientProfile(
                UUID.randomUUID(),
                user.getId(),
                request.fullName(),
                request.documentType(),
                request.documentNumber(),
                request.phone(),
                request.address(),
                request.city(),
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        ClientProfile saved = clientProfileRepository.save(profile);
        return mapToClientResponse(saved);
    }

    @Transactional(readOnly = true)
    public ClientProfileResponse getClientProfileById(UUID id) {
        ClientProfile profile = clientProfileRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ClientProfile", id));
        return mapToClientResponse(profile);
    }

    @Transactional
    public ClientProfileResponse getClientProfileByUserId(UUID userId) {
        ClientProfile profile = clientProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new EntityNotFoundException("User", userId));
                    ClientProfile auto = new ClientProfile(
                            UUID.randomUUID(),
                            user.getId(),
                            user.getUsername(),
                            "CC",
                            "CLI-" + (1000000000L + Math.abs(user.getId().getLeastSignificantBits() % 9000000000L)),
                            "3001234567",
                            "Bogotá D.C.",
                            "Bogotá",
                            LocalDateTime.now(),
                            LocalDateTime.now()
                    );
                    return clientProfileRepository.save(auto);
                });
        return mapToClientResponse(profile);
    }

    @Transactional(readOnly = true)
    public ClientProfileResponse getClientProfileByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User", username));
        return getClientProfileByUserId(user.getId());
    }

    @Transactional(readOnly = true)
    public List<ClientProfileResponse> getAllClientProfiles() {
        return clientProfileRepository.findAll().stream()
                .map(this::mapToClientResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ClientProfileResponse updateClientProfile(UUID id, ClientProfileRequest request) {
        ClientProfile profile = clientProfileRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ClientProfile", id));

        validateProfileFields(request.fullName(), request.phone(), request.address(), request.city(), false);

        profile.update(request.fullName(), request.phone(), request.address(), request.city());
        ClientProfile updated = clientProfileRepository.save(profile);
        return mapToClientResponse(updated);
    }

    @Transactional
    public void deleteClientProfile(UUID id) {
        if (clientProfileRepository.findById(id).isEmpty()) {
            throw new EntityNotFoundException("ClientProfile", id);
        }
        clientProfileRepository.deleteById(id);
    }

    // ---------------------------------------------------------
    // PROVIDER PROFILE OPERATIONS
    // ---------------------------------------------------------

    @Transactional
    public ProviderProfileResponse createProviderProfile(ProviderProfileRequest request) {
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new EntityNotFoundException("User", request.userId()));

        if (providerProfileRepository.findByUserId(user.getId()).isPresent()) {
            throw new BusinessRuleViolationException("El perfil de proveedor ya existe para este usuario.");
        }

        validateProfileFields(request.companyName(), request.phone(), request.address(), request.city(), true);

        ProviderProfile profile = new ProviderProfile(
                UUID.randomUUID(),
                user.getId(),
                request.companyName(),
                request.taxId(),
                request.phone(),
                request.address(),
                request.city(),
                false,
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        ProviderProfile saved = providerProfileRepository.save(profile);
        return mapToProviderResponse(saved);
    }

    @Transactional(readOnly = true)
    public ProviderProfileResponse getProviderProfileById(UUID id) {
        ProviderProfile profile = providerProfileRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ProviderProfile", id));
        return mapToProviderResponse(profile);
    }

    @Transactional
    public ProviderProfileResponse getProviderProfileByUserId(UUID userId) {
        ProviderProfile profile = providerProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new EntityNotFoundException("User", userId));
                    ProviderProfile auto = new ProviderProfile(
                            UUID.randomUUID(),
                            user.getId(),
                            user.getUsername() + " Equipos",
                            "NIT-" + (100000000L + Math.abs(user.getId().getLeastSignificantBits() % 900000000L)) + "-1",
                            "3001234567",
                            "Bogotá D.C.",
                            "Bogotá",
                            false,
                            LocalDateTime.now(),
                            LocalDateTime.now()
                    );
                    return providerProfileRepository.save(auto);
                });
        return mapToProviderResponse(profile);
    }

    @Transactional(readOnly = true)
    public ProviderProfileResponse getProviderProfileByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User", username));
        return getProviderProfileByUserId(user.getId());
    }

    @Transactional(readOnly = true)
    public List<ProviderProfileResponse> getAllProviderProfiles() {
        return providerProfileRepository.findAll().stream()
                .map(this::mapToProviderResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProviderProfileResponse updateProviderProfile(UUID id, ProviderProfileRequest request) {
        ProviderProfile profile = providerProfileRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ProviderProfile", id));

        validateProfileFields(request.companyName(), request.phone(), request.address(), request.city(), true);

        profile.update(request.companyName(), request.phone(), request.address(), request.city());
        ProviderProfile updated = providerProfileRepository.save(profile);
        return mapToProviderResponse(updated);
    }

    private void validateProfileFields(String nameOrCompany, String phone, String address, String city, boolean isProvider) {
        if (nameOrCompany == null || nameOrCompany.trim().length() < 3) {
            throw new BusinessRuleViolationException("El " + (isProvider ? "nombre de la razón social" : "nombre completo") + " debe tener al menos 3 caracteres.");
        }
        String cleanName = nameOrCompany.trim();
        String alphaNum = cleanName.replaceAll("[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ]", "");
        if (alphaNum.length() < 3) {
            throw new BusinessRuleViolationException("El " + (isProvider ? "nombre de la razón social" : "nombre completo") + " debe contener palabras legibles y no solo puntos o símbolos.");
        }

        if (phone != null && !phone.isBlank()) {
            String p = phone.trim();
            if (!p.matches("^\\d{10}$")) {
                throw new BusinessRuleViolationException("El teléfono debe contener exactamente 10 dígitos numéricos (ej. 3001234567).");
            }
        }

        if (city != null && !city.isBlank()) {
            String c = city.trim();
            if (!c.matches("^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\\s]{3,40}$") || c.replaceAll("[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]", "").length() < 3) {
                throw new BusinessRuleViolationException("La ciudad solo puede contener letras y espacios (entre 3 y 40 caracteres, ej. Bogotá).");
            }
        }

        if (address != null && !address.isBlank()) {
            String a = address.trim();
            if (a.length() < 5 || a.length() > 100 || a.replaceAll("[^a-zA-Z0-9]", "").length() < 4 || a.matches(".*[-.#,]{2,}.*") || a.matches("^[.#\\s-]+$")) {
                throw new BusinessRuleViolationException("La dirección debe tener un formato válido de al menos 5 caracteres (ej. Calle 100 # 15-20) sin secuencias de símbolos repetidos.");
            }
        }
    }

    @Transactional
    public ProviderProfileResponse verifyProviderProfile(UUID id) {
        ProviderProfile profile = providerProfileRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ProviderProfile", id));

        profile.verify();
        ProviderProfile updated = providerProfileRepository.save(profile);
        return mapToProviderResponse(updated);
    }

    @Transactional
    public void deleteProviderProfile(UUID id) {
        if (providerProfileRepository.findById(id).isEmpty()) {
            throw new EntityNotFoundException("ProviderProfile", id);
        }
        providerProfileRepository.deleteById(id);
    }

    // ---------------------------------------------------------
    // MAPPERS
    // ---------------------------------------------------------

    private ClientProfileResponse mapToClientResponse(ClientProfile profile) {
        return new ClientProfileResponse(
                profile.getId(),
                profile.getUserId(),
                profile.getFullName(),
                profile.getDocumentType(),
                profile.getDocumentNumber(),
                profile.getPhone(),
                profile.getAddress(),
                profile.getCity(),
                profile.getCreatedAt(),
                profile.getUpdatedAt()
        );
    }

    private ProviderProfileResponse mapToProviderResponse(ProviderProfile profile) {
        return new ProviderProfileResponse(
                profile.getId(),
                profile.getUserId(),
                profile.getCompanyName(),
                profile.getTaxId(),
                profile.getPhone(),
                profile.getAddress(),
                profile.getCity(),
                profile.isVerified(),
                profile.getCreatedAt(),
                profile.getUpdatedAt()
        );
    }

    @Transactional(readOnly = true)
    public UUID getUserIdByUsername(String username) {
        return userRepository.findByUsername(username)
                .map(User::getId)
                .orElseThrow(() -> new EntityNotFoundException("User", username));
    }
}
