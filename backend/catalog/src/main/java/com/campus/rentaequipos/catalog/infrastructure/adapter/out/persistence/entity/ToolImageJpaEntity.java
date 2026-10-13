package com.campus.rentaequipos.catalog.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "tool_images")
public class ToolImageJpaEntity {

    @Id
    private UUID id;

    @Column(name = "tool_id", nullable = false, insertable = false, updatable = false)
    private UUID toolId;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(name = "is_primary", nullable = false)
    private boolean isPrimary;

    public ToolImageJpaEntity() {}

    public ToolImageJpaEntity(UUID id, UUID toolId, String imageUrl, boolean isPrimary) {
        this.id = id;
        this.toolId = toolId;
        this.imageUrl = imageUrl;
        this.isPrimary = isPrimary;
    }

    public UUID getId() { return id; }
    public UUID getToolId() { return toolId; }
    public String getImageUrl() { return imageUrl; }
    public boolean isPrimary() { return isPrimary; }
}
