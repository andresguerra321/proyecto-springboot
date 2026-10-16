package com.campus.rentaequipos.identity.application.usecase;

import com.campus.rentaequipos.identity.application.dto.ClientProfileRequest;
import com.campus.rentaequipos.identity.application.dto.ClientProfileResponse;
import com.campus.rentaequipos.identity.application.dto.ProviderProfileRequest;
import com.campus.rentaequipos.identity.application.dto.ProviderProfileResponse;
import com.campus.rentaequipos.identity.domain.model.ClientProfile;
import com.campus.rentaequipos.identity.domain.model.ProviderProfile;
import com.campus.rentaequipos.identity.domain.model.Role;
import com.campus.rentaequipos.identity.domain.model.User;
import com.campus.rentaequipos.identity.domain.repository.ClientProfileRepository;
import com.campus.rentaequipos.identity.domain.repository.ProviderProfileRepository;
import com.campus.rentaequipos.identity.domain.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProfileUseCase Unit Tests")
class ProfileUseCaseTest {

    @Mock
    private ClientProfileRepository clientProfileRepository;

    @Mock
    private ProviderProfileRepository providerProfileRepository;

    @Mock
    private UserRepository userRepository;

    private ProfileUseCase profileUseCase;

    private UUID userId;
    private User testUser;

    @BeforeEach
    void setUp() {
        profileUseCase = new ProfileUseCase(clientProfileRepository, providerProfileRepository, userRepository);
        userId = UUID.randomUUID();
        testUser = new User(userId, "carlos_gomez", "carlos@example.com", "hash", true, Set.of(Role.ROLE_CLIENTE));
    }

    @Test
    @DisplayName("Debe crear un perfil comercial de cliente correctamente")
    void shouldCreateClientProfile() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(clientProfileRepository.findByUserId(userId)).thenReturn(Optional.empty());
        when(clientProfileRepository.save(any(ClientProfile.class))).thenAnswer(i -> i.getArgument(0));

        ClientProfileRequest request = new ClientProfileRequest(
                userId,
                "Carlos Gómez",
                "CC",
                "1098765432",
                "3001234567",
                "Calle 45 # 12-34",
                "Bucaramanga"
        );

        ClientProfileResponse response = profileUseCase.createClientProfile(request);

        assertNotNull(response);
        assertEquals("Carlos Gómez", response.fullName());
        assertEquals("1098765432", response.documentNumber());
        assertEquals("Bucaramanga", response.city());
        verify(clientProfileRepository).save(any(ClientProfile.class));
    }

    @Test
    @DisplayName("Debe crear y verificar un perfil de proveedor comercial")
    void shouldCreateAndVerifyProviderProfile() {
        UUID providerUserId = UUID.randomUUID();
        User providerUser = new User(providerUserId, "ferreteria_central", "ferreteria@example.com", "hash", true, Set.of(Role.ROLE_PROVEEDOR));

        when(userRepository.findById(providerUserId)).thenReturn(Optional.of(providerUser));
        when(providerProfileRepository.findByUserId(providerUserId)).thenReturn(Optional.empty());
        when(providerProfileRepository.save(any(ProviderProfile.class))).thenAnswer(i -> i.getArgument(0));

        ProviderProfileRequest request = new ProviderProfileRequest(
                providerUserId,
                "Ferretería y Equipos Central S.A.S.",
                "900123456-1",
                "3109876543",
                "Carrera 27 # 36-10",
                "Bucaramanga"
        );

        ProviderProfileResponse response = profileUseCase.createProviderProfile(request);

        assertNotNull(response);
        assertEquals("Ferretería y Equipos Central S.A.S.", response.companyName());
        assertFalse(response.isVerified());

        // Now test verification
        UUID profileId = response.id();
        ProviderProfile savedProfile = new ProviderProfile(
                profileId, providerUserId, request.companyName(), request.taxId(),
                request.phone(), request.address(), request.city(), false,
                LocalDateTime.now(), LocalDateTime.now()
        );
        when(providerProfileRepository.findById(profileId)).thenReturn(Optional.of(savedProfile));

        ProviderProfileResponse verifiedResponse = profileUseCase.verifyProviderProfile(profileId);
        assertTrue(verifiedResponse.isVerified());
        verify(providerProfileRepository, times(2)).save(any(ProviderProfile.class));
    }
}
