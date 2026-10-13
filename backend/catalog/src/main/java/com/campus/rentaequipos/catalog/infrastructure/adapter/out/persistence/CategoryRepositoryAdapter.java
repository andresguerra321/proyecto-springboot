package com.campus.rentaequipos.catalog.infrastructure.adapter.out.persistence;

import com.campus.rentaequipos.catalog.domain.model.Category;
import com.campus.rentaequipos.catalog.domain.repository.CategoryRepository;
import com.campus.rentaequipos.catalog.infrastructure.adapter.out.persistence.entity.CategoryJpaEntity;
import com.campus.rentaequipos.catalog.infrastructure.adapter.out.persistence.repository.SpringDataCategoryRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class CategoryRepositoryAdapter implements CategoryRepository {

    private final SpringDataCategoryRepository repository;

    public CategoryRepositoryAdapter(SpringDataCategoryRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<Category> findById(UUID id) {
        return repository.findById(id).map(this::toDomain);
    }

    @Override
    public List<Category> findAll() {
        return repository.findAll().stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public Category save(Category category) {
        CategoryJpaEntity entity = toEntity(category);
        CategoryJpaEntity savedEntity = repository.save(entity);
        return toDomain(savedEntity);
    }

    public Category toDomain(CategoryJpaEntity entity) {
        return new Category(entity.getId(), entity.getName(), entity.getDescription());
    }

    public CategoryJpaEntity toEntity(Category category) {
        return new CategoryJpaEntity(category.getId(), category.getName(), category.getDescription());
    }
}
