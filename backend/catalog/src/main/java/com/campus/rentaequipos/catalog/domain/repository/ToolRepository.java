package com.campus.rentaequipos.catalog.domain.repository;

import com.campus.rentaequipos.catalog.domain.model.Tool;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ToolRepository {
    Optional<Tool> findById(UUID id);
    List<Tool> findAll();
    List<Tool> findByCategoryId(UUID categoryId);
    List<Tool> findByProviderId(UUID providerId);
    Tool save(Tool tool);
    void deleteById(UUID id);
}
