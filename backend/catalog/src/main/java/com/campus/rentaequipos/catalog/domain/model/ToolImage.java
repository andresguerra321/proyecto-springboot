package com.campus.rentaequipos.catalog.domain.model;

import java.util.UUID;

public class ToolImage {
    private UUID id;
    private String imageUrl;
    private boolean isPrimary;

    public ToolImage(UUID id, String imageUrl, boolean isPrimary) {
        this.id = id;
        this.imageUrl = imageUrl;
        this.isPrimary = isPrimary;
    }

    public UUID getId() {
        return id;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public boolean isPrimary() {
        return isPrimary;
    }
}
