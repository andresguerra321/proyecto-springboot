package com.campus.rentaequipos.catalog.infrastructure.adapter.out.persistence;

import com.campus.rentaequipos.catalog.domain.model.Category;
import com.campus.rentaequipos.catalog.domain.model.Tool;
import com.campus.rentaequipos.catalog.domain.model.ToolImage;
import com.campus.rentaequipos.catalog.domain.model.ToolSpecification;
import com.campus.rentaequipos.catalog.domain.model.ToolStatus;
import com.campus.rentaequipos.catalog.domain.repository.ToolRepository;
import com.campus.rentaequipos.catalog.infrastructure.adapter.out.persistence.entity.CategoryJpaEntity;
import com.campus.rentaequipos.catalog.infrastructure.adapter.out.persistence.entity.ToolImageJpaEntity;
import com.campus.rentaequipos.catalog.infrastructure.adapter.out.persistence.entity.ToolJpaEntity;
import com.campus.rentaequipos.catalog.infrastructure.adapter.out.persistence.entity.ToolSpecificationJpaEntity;
import com.campus.rentaequipos.catalog.infrastructure.adapter.out.persistence.repository.SpringDataToolRepository;
import com.campus.rentaequipos.shared.domain.valueobject.Money;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class ToolRepositoryAdapter implements ToolRepository {

    private final SpringDataToolRepository toolRepository;
    private final CategoryRepositoryAdapter categoryAdapter;

    public ToolRepositoryAdapter(SpringDataToolRepository toolRepository, CategoryRepositoryAdapter categoryAdapter) {
        this.toolRepository = toolRepository;
        this.categoryAdapter = categoryAdapter;
    }

    @Override
    public Optional<Tool> findById(UUID id) {
        return toolRepository.findById(id).map(this::toDomain);
    }

    @Override
    public List<Tool> findAll() {
        return toolRepository.findAll().stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public List<Tool> findByCategoryId(UUID categoryId) {
        return toolRepository.findByCategory_Id(categoryId).stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public List<Tool> findByProviderId(UUID providerId) {
        return toolRepository.findByProviderId(providerId).stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public Tool save(Tool tool) {
        ToolJpaEntity entity = toEntity(tool);
        ToolJpaEntity savedEntity = toolRepository.save(entity);
        return toDomain(savedEntity);
    }

    @Override
    public void deleteById(UUID id) {
        toolRepository.deleteById(id);
    }

    private Tool toDomain(ToolJpaEntity entity) {
        Category category = categoryAdapter.toDomain(entity.getCategory());

        List<ToolImage> images = entity.getImages().stream()
                .map(img -> new ToolImage(img.getId(), img.getImageUrl(), img.isPrimary()))
                .collect(Collectors.toList());

        List<ToolSpecification> specs = entity.getSpecifications().stream()
                .map(spec -> new ToolSpecification(spec.getId(), spec.getSpecName(), spec.getSpecValue()))
                .collect(Collectors.toList());

        return new Tool(
                entity.getId(),
                entity.getProviderId(),
                category,
                entity.getName(),
                entity.getBrand(),
                entity.getModel(),
                entity.getSerialNumber(),
                entity.getDescription(),
                Money.of(entity.getDailyPrice()),
                Money.of(entity.getReplacementValue()),
                ToolStatus.valueOf(entity.getStatus()),
                images,
                specs
        );
    }

    private ToolJpaEntity toEntity(Tool tool) {
        CategoryJpaEntity categoryJpaEntity = categoryAdapter.toEntity(tool.getCategory());

        List<ToolImageJpaEntity> images = tool.getImages().stream()
                .map(img -> new ToolImageJpaEntity(img.getId(), tool.getId(), img.getImageUrl(), img.isPrimary()))
                .collect(Collectors.toList());

        List<ToolSpecificationJpaEntity> specs = tool.getSpecifications().stream()
                .map(spec -> new ToolSpecificationJpaEntity(spec.getId(), tool.getId(), spec.getSpecName(), spec.getSpecValue()))
                .collect(Collectors.toList());

        return new ToolJpaEntity(
                tool.getId(),
                tool.getProviderId(),
                categoryJpaEntity,
                tool.getName(),
                tool.getBrand(),
                tool.getModel(),
                tool.getSerialNumber(),
                tool.getDescription(),
                tool.getDailyPrice().getAmount(),
                tool.getReplacementValue().getAmount(),
                tool.getStatus().name(),
                images,
                specs
        );
    }
}
