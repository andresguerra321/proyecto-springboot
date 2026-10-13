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
public class ToolUseCase {

    private final ToolRepository toolRepository;
    private final CategoryRepository categoryRepository;

    public ToolUseCase(ToolRepository toolRepository, CategoryRepository categoryRepository) {
        this.toolRepository = toolRepository;
        this.categoryRepository = categoryRepository;
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

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new EntityNotFoundException("Category", request.categoryId()));

        List<ToolImage> images = request.images() != null ? request.images().stream()
                .map(img -> new ToolImage(UUID.randomUUID(), img.imageUrl(), img.isPrimary()))
                .collect(Collectors.toList()) : tool.getImages();

        List<ToolSpecification> specs = request.specifications() != null ? request.specifications().stream()
                .map(spec -> new ToolSpecification(UUID.randomUUID(), spec.specName(), spec.specValue()))
                .collect(Collectors.toList()) : tool.getSpecifications();

        tool.updateDetails(
                category,
                request.name(),
                request.brand(),
                request.model(),
                request.serialNumber(),
                request.description(),
                Money.of(request.dailyPrice()),
                Money.of(request.replacementValue()),
                images,
                specs
        );

        Tool updatedTool = toolRepository.save(tool);
        return mapToResponse(updatedTool);
    }

    @Transactional
    public void deleteTool(UUID id) {
        if (toolRepository.findById(id).isEmpty()) {
            throw new EntityNotFoundException("Tool", id);
        }
        toolRepository.deleteById(id);
    }

    @Transactional
    public ToolResponse registerTool(ToolRequest request) {
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
}
