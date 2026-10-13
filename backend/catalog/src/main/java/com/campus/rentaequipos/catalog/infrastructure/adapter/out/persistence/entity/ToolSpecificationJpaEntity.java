package com.campus.rentaequipos.catalog.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "tool_specifications")
public class ToolSpecificationJpaEntity {

    @Id
    private UUID id;

    @Column(name = "tool_id", nullable = false, insertable = false, updatable = false)
    private UUID toolId;

    @Column(name = "spec_name", nullable = false, length = 100)
    private String specName;

    @Column(name = "spec_value", nullable = false, length = 150)
    private String specValue;

    public ToolSpecificationJpaEntity() {}

    public ToolSpecificationJpaEntity(UUID id, UUID toolId, String specName, String specValue) {
        this.id = id;
        this.toolId = toolId;
        this.specName = specName;
        this.specValue = specValue;
    }

    public UUID getId() { return id; }
    public UUID getToolId() { return toolId; }
    public String getSpecName() { return specName; }
    public String getSpecValue() { return specValue; }
}
