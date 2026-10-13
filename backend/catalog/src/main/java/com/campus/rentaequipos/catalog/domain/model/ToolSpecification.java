package com.campus.rentaequipos.catalog.domain.model;

import java.util.UUID;

public class ToolSpecification {
    private UUID id;
    private String specName;
    private String specValue;

    public ToolSpecification(UUID id, String specName, String specValue) {
        this.id = id;
        this.specName = specName;
        this.specValue = specValue;
    }

    public UUID getId() {
        return id;
    }

    public String getSpecName() {
        return specName;
    }

    public String getSpecValue() {
        return specValue;
    }
}
