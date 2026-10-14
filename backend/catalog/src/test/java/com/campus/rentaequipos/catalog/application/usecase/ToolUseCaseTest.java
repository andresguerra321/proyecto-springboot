package com.campus.rentaequipos.catalog.application.usecase;

import com.campus.rentaequipos.catalog.application.dto.ToolRequest;
import com.campus.rentaequipos.catalog.application.dto.ToolResponse;
import com.campus.rentaequipos.catalog.domain.model.Category;
import com.campus.rentaequipos.catalog.domain.model.Tool;
import com.campus.rentaequipos.catalog.domain.model.ToolStatus;
import com.campus.rentaequipos.catalog.domain.repository.CategoryRepository;
import com.campus.rentaequipos.catalog.domain.repository.ToolRepository;
import com.campus.rentaequipos.shared.domain.exception.EntityNotFoundException;
import com.campus.rentaequipos.shared.domain.valueobject.Money;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ToolUseCase Unit Tests")
class ToolUseCaseTest {

    @Mock
    private ToolRepository toolRepository;

    @Mock
    private CategoryRepository categoryRepository;

    private ToolUseCase toolUseCase;

    private Category testCategory;
    private Tool testTool;
    private UUID toolId;
    private UUID categoryId;

    @BeforeEach
    void setUp() {
        toolUseCase = new ToolUseCase(toolRepository, categoryRepository);
        categoryId = UUID.randomUUID();
        toolId = UUID.randomUUID();

        testCategory = new Category(categoryId, "Herramientas Eléctricas", "Herramientas de potencia");
        testTool = new Tool(
                toolId,
                UUID.randomUUID(),
                testCategory,
                "Rotomartillo SDS Plus",
                "Bosch",
                "GBH 2-28",
                "SN-12345",
                "Rotomartillo profesional de 880W",
                Money.of(25.00),
                Money.of(250.00),
                ToolStatus.AVAILABLE,
                Collections.emptyList(),
                Collections.emptyList()
        );
    }

    @Test
    @DisplayName("Debe encontrar herramienta por ID correctamente")
    void shouldFindToolById() {
        when(toolRepository.findById(toolId)).thenReturn(Optional.of(testTool));

        ToolResponse response = toolUseCase.getToolById(toolId);

        assertNotNull(response);
        assertEquals(toolId, response.id());
        assertEquals("Rotomartillo SDS Plus", response.name());
        verify(toolRepository).findById(toolId);
    }

    @Test
    @DisplayName("Debe lanzar EntityNotFoundException si la herramienta no existe")
    void shouldThrowExceptionWhenToolNotFound() {
        UUID unknownId = UUID.randomUUID();
        when(toolRepository.findById(unknownId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> toolUseCase.getToolById(unknownId));
    }

    @Test
    @DisplayName("Debe registrar una nueva herramienta")
    void shouldRegisterNewTool() {
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(testCategory));
        when(toolRepository.save(any(Tool.class))).thenReturn(testTool);

        ToolRequest request = new ToolRequest(
                UUID.randomUUID(),
                categoryId,
                "Rotomartillo SDS Plus",
                "Bosch",
                "GBH 2-28",
                "SN-12345",
                "Rotomartillo profesional de 880W",
                BigDecimal.valueOf(25.00),
                BigDecimal.valueOf(250.00),
                Collections.emptyList(),
                Collections.emptyList()
        );

        ToolResponse response = toolUseCase.registerTool(request);

        assertNotNull(response);
        assertEquals("Rotomartillo SDS Plus", response.name());
        verify(toolRepository).save(any(Tool.class));
    }

    @Test
    @DisplayName("Debe dar de baja (soft-delete a RETIRED) una herramienta existente")
    void shouldDeleteTool() {
        when(toolRepository.findById(toolId)).thenReturn(Optional.of(testTool));
        when(toolRepository.save(any(Tool.class))).thenAnswer(i -> i.getArgument(0));

        assertDoesNotThrow(() -> toolUseCase.deleteTool(toolId));
        assertEquals(ToolStatus.RETIRED, testTool.getStatus());
        verify(toolRepository).save(testTool);
    }
}
