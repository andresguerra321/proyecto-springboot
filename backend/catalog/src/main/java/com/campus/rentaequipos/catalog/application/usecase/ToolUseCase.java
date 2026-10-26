package com.campus.rentaequipos.catalog.application.usecase;

import com.campus.rentaequipos.catalog.application.dto.CategoryResponse;
import com.campus.rentaequipos.catalog.application.dto.ToolRequest;
import com.campus.rentaequipos.catalog.application.dto.ToolResponse;
import com.campus.rentaequipos.catalog.domain.model.Category;
import com.campus.rentaequipos.catalog.domain.model.Tool;
import com.campus.rentaequipos.catalog.domain.model.ToolImage;
import com.campus.rentaequipos.catalog.domain.model.ToolSpecification;
import com.campus.rentaequipos.catalog.domain.model.ToolStatus;
import com.campus.rentaequipos.catalog.domain.repository.CategoryRepository;
import com.campus.rentaequipos.catalog.domain.repository.ToolRepository;
import com.campus.rentaequipos.shared.domain.exception.EntityNotFoundException;
import com.campus.rentaequipos.shared.domain.valueobject.Money;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ToolUseCase {

    private final ToolRepository toolRepository;
    private final CategoryRepository categoryRepository;
    private final com.campus.rentaequipos.catalog.domain.repository.ProviderVerificationPort providerVerificationPort;

    public ToolUseCase(ToolRepository toolRepository, CategoryRepository categoryRepository,
                       com.campus.rentaequipos.catalog.domain.repository.ProviderVerificationPort providerVerificationPort) {
        this.toolRepository = toolRepository;
        this.categoryRepository = categoryRepository;
        this.providerVerificationPort = providerVerificationPort;
    }

    /** Herramientas de la misma categoría, disponibles, ordenadas por cercanía de precio diario. */
    @Transactional(readOnly = true)
    public List<ToolResponse> getSimilarTools(UUID id, int limit) {
        Tool base = toolRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tool", id));
        java.math.BigDecimal basePrice = base.getDailyPrice().getAmount();
        return toolRepository.findByCategoryId(base.getCategory().getId()).stream()
                .filter(t -> !t.getId().equals(base.getId()))
                .filter(t -> t.getStatus() == ToolStatus.AVAILABLE)
                .sorted(java.util.Comparator.comparing(t -> t.getDailyPrice().getAmount().subtract(basePrice).abs()))
                .limit(Math.max(1, limit))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ToolResponse> getAllTools() {
        return toolRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ToolResponse> getTools(UUID categoryId, UUID providerId, String status, String search) {
        List<Tool> list;
        if (categoryId != null) {
            list = toolRepository.findByCategoryId(categoryId);
        } else if (providerId != null) {
            list = toolRepository.findByProviderId(providerId);
        } else {
            list = toolRepository.findAll();
        }

        return list.stream()
                .filter(t -> status == null || t.getStatus().name().equalsIgnoreCase(status))
                .filter(t -> search == null || search.isBlank() ||
                        t.getName().toLowerCase().contains(search.toLowerCase()) ||
                        (t.getBrand() != null && t.getBrand().toLowerCase().contains(search.toLowerCase())) ||
                        (t.getDescription() != null && t.getDescription().toLowerCase().contains(search.toLowerCase())))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(c -> new CategoryResponse(c.getId(), c.getName(), c.getDescription()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ToolResponse getToolById(UUID id) {
        return toolRepository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new EntityNotFoundException("Tool", id));
    }

    @Transactional
    public ToolResponse updateTool(UUID id, ToolRequest request) {
        Tool tool = toolRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tool", id));

        Category category = request.categoryId() != null
                ? categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new EntityNotFoundException("Category", request.categoryId()))
                : tool.getCategory();

        List<ToolImage> images = (request.images() != null && !request.images().isEmpty()) ? request.images().stream()
                .map(img -> new ToolImage(UUID.randomUUID(), img.imageUrl(), img.isPrimary()))
                .collect(Collectors.toList()) : tool.getImages();

        List<ToolSpecification> specs = (request.specifications() != null && !request.specifications().isEmpty()) ? request.specifications().stream()
                .map(spec -> new ToolSpecification(UUID.randomUUID(), spec.specName(), spec.specValue()))
                .collect(Collectors.toList()) : tool.getSpecifications();

        validateToolDetails(request.name(), request.description(), request.dailyPrice(), request.replacementValue());

        String name = request.name() != null && !request.name().isBlank() ? request.name() : tool.getName();
        String brand = request.brand() != null ? request.brand() : tool.getBrand();
        String model = request.model() != null ? request.model() : tool.getModel();
        String serialNumber = request.serialNumber() != null ? request.serialNumber() : tool.getSerialNumber();
        String description = request.description() != null ? request.description() : tool.getDescription();
        Money dailyPrice = request.dailyPrice() != null ? Money.of(request.dailyPrice()) : tool.getDailyPrice();
        Money replacementValue = request.replacementValue() != null ? Money.of(request.replacementValue()) : tool.getReplacementValue();

        tool.updateDetails(
                category,
                name,
                brand,
                model,
                serialNumber,
                description,
                dailyPrice,
                replacementValue,
                images,
                specs
        );

        if (request.status() != null && !request.status().isBlank()) {
            try {
                ToolStatus newStatus = ToolStatus.valueOf(request.status().toUpperCase());
                if (newStatus == ToolStatus.AVAILABLE || newStatus == ToolStatus.MAINTENANCE) {
                    tool.updateStatus(newStatus);
                }
            } catch (IllegalArgumentException ignored) {}
        }

        Tool updatedTool = toolRepository.save(tool);
        return mapToResponse(updatedTool);
    }

    @Transactional
    public ToolResponse updateToolStatus(UUID id, ToolStatus newStatus) {
        Tool tool = toolRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tool", id));
        tool.updateStatus(newStatus);
        Tool saved = toolRepository.save(tool);
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteTool(UUID id) {
        Tool tool = toolRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tool", id));
        // Soft delete para garantizar integridad referencial estricta 4FN con historial de rental_items
        tool.updateStatus(ToolStatus.RETIRED);
        toolRepository.save(tool);
    }

    @Transactional
    public ToolResponse registerTool(ToolRequest request) {
        validateToolDetails(request.name(), request.description(), request.dailyPrice(), request.replacementValue());

        if (request.providerId() == null || !providerVerificationPort.isProviderVerified(request.providerId())) {
            throw new com.campus.rentaequipos.shared.domain.exception.BusinessRuleViolationException(
                    "El proveedor aún no ha sido verificado por un administrador. No puede publicar herramientas.");
        }

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new EntityNotFoundException("Category", request.categoryId()));

        List<ToolImage> images = request.images() != null ? request.images().stream()
                .map(img -> new ToolImage(UUID.randomUUID(), img.imageUrl(), img.isPrimary()))
                .collect(Collectors.toList()) : List.of();

        List<ToolSpecification> specs = request.specifications() != null ? request.specifications().stream()
                .map(spec -> new ToolSpecification(UUID.randomUUID(), spec.specName(), spec.specValue()))
                .collect(Collectors.toList()) : List.of();

        Tool tool = new Tool(
                UUID.randomUUID(),
                request.providerId(),
                category,
                request.name(),
                request.brand(),
                request.model(),
                request.serialNumber(),
                request.description(),
                Money.of(request.dailyPrice()),
                Money.of(request.replacementValue()),
                ToolStatus.AVAILABLE,
                images,
                specs
        );

        Tool savedTool = toolRepository.save(tool);
        return mapToResponse(savedTool);
    }

    @Transactional
    public ToolResponse addImageToTool(UUID toolId, String imageUrl, boolean isPrimary) {
        Tool tool = toolRepository.findById(toolId)
                .orElseThrow(() -> new EntityNotFoundException("Tool", toolId));
        ToolImage image = new ToolImage(UUID.randomUUID(), imageUrl, isPrimary);
        tool.addImage(image);
        Tool saved = toolRepository.save(tool);
        return mapToResponse(saved);
    }

    private ToolResponse mapToResponse(Tool tool) {
        CategoryResponse categoryResponse = new CategoryResponse(
                tool.getCategory().getId(),
                tool.getCategory().getName(),
                tool.getCategory().getDescription()
        );

        List<ToolResponse.ImageResponse> imageResponses = tool.getImages().stream()
                .map(img -> new ToolResponse.ImageResponse(img.getId(), img.getImageUrl(), img.isPrimary()))
                .collect(Collectors.toList());

        List<ToolResponse.SpecificationResponse> specResponses = tool.getSpecifications().stream()
                .map(spec -> new ToolResponse.SpecificationResponse(spec.getId(), spec.getSpecName(), spec.getSpecValue()))
                .collect(Collectors.toList());

        return new ToolResponse(
                tool.getId(),
                tool.getProviderId(),
                categoryResponse,
                tool.getName(),
                tool.getBrand(),
                tool.getModel(),
                tool.getSerialNumber(),
                tool.getDescription(),
                tool.getDailyPrice().getAmount(),
                tool.getReplacementValue().getAmount(),
                tool.getStatus().name(),
                imageResponses,
                specResponses
        );
    }

    private void validateToolDetails(String name, String description, java.math.BigDecimal dailyPrice, java.math.BigDecimal replacementValue) {
        if (name == null || name.trim().length() < 4 || name.trim().length() > 100) {
            throw new IllegalArgumentException("El nombre de la herramienta debe tener entre 4 y 100 caracteres.");
        }
        String cleanName = name.trim();
        String nameAlpha = cleanName.replaceAll("[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ]", "");
        if (nameAlpha.length() < 3 || cleanName.matches("^[\\W_]+$")) {
            throw new IllegalArgumentException("El nombre de la herramienta no es válido. Debe contener al menos 3 caracteres alfanuméricos legibles.");
        }
        if (description == null || description.trim().length() < 15 || description.trim().length() > 1000) {
            throw new IllegalArgumentException("La descripción técnica debe ser detallada y contener entre 15 y 1000 caracteres.");
        }
        String descAlpha = description.trim().replaceAll("[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ]", "");
        if (descAlpha.length() < 10) {
            throw new IllegalArgumentException("La descripción técnica debe incluir palabras legibles y especificaciones técnicas del equipo.");
        }
        if (dailyPrice == null || dailyPrice.compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("La tarifa diaria debe ser mayor a cero.");
        }
        java.math.BigDecimal maxPrice = new java.math.BigDecimal("999999999.99");
        if (dailyPrice.compareTo(maxPrice) > 0) {
            throw new IllegalArgumentException("La tarifa diaria no puede exceder $999.999.999 COP.");
        }
        if (replacementValue != null) {
            if (replacementValue.compareTo(java.math.BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("El valor de reposición debe ser mayor a cero.");
            }
            java.math.BigDecimal maxReplacement = new java.math.BigDecimal("9999999999.99");
            if (replacementValue.compareTo(maxReplacement) > 0) {
                throw new IllegalArgumentException("El valor de reposición no puede exceder $9.999.999.999 COP.");
            }
        }
    }
}
