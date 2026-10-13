package com.campus.rentaequipos.catalog.domain.model;

import java.util.UUID;

public class Category {
    private UUID id;
    private String name;
    private String description;

    public Category(UUID id, String name, String description) {
        this.id = id;
        this.name = name;
        this.description = description;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }
}
