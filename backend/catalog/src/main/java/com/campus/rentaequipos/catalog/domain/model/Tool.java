package com.campus.rentaequipos.catalog.domain.model;

import com.campus.rentaequipos.shared.domain.valueobject.Money;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class Tool {
    private UUID id;
    private UUID providerId;
    private Category category;
    private String name;
    private String brand;
    private String model;
    private String serialNumber;
    private String description;
    private Money dailyPrice;
    private Money replacementValue;
    private ToolStatus status;
    private List<ToolImage> images;
    private List<ToolSpecification> specifications;

    public Tool(UUID id, UUID providerId, Category category, String name, String brand, String model,
                String serialNumber, String description, Money dailyPrice, Money replacementValue,
                ToolStatus status, List<ToolImage> images, List<ToolSpecification> specifications) {
        this.id = id;
        this.providerId = providerId;
        this.category = category;
        this.name = name;
        this.brand = brand;
        this.model = model;
        this.serialNumber = serialNumber;
        this.description = description;
        this.dailyPrice = dailyPrice;
        this.replacementValue = replacementValue;
        this.status = status;
        this.images = images != null ? images : new ArrayList<>();
        this.specifications = specifications != null ? specifications : new ArrayList<>();
    }

    public void updateStatus(ToolStatus newStatus) {
        this.status = newStatus;
    }

    public void updateDetails(Category category, String name, String brand, String model,
                              String serialNumber, String description, Money dailyPrice,
                              Money replacementValue, List<ToolImage> images,
                              List<ToolSpecification> specifications) {
        this.category = category;
        this.name = name;
        this.brand = brand;
        this.model = model;
        this.serialNumber = serialNumber;
        this.description = description;
        this.dailyPrice = dailyPrice;
        this.replacementValue = replacementValue;
        if (images != null) {
            this.images = images;
        }
        if (specifications != null) {
            this.specifications = specifications;
        }
    }

    public void addImage(ToolImage image) {
        if (this.images == null) {
            this.images = new ArrayList<>();
        }
        this.images.add(image);
    }

    // Getters
    public UUID getId() { return id; }
    public UUID getProviderId() { return providerId; }
    public Category getCategory() { return category; }
    public String getName() { return name; }
    public String getBrand() { return brand; }
    public String getModel() { return model; }
    public String getSerialNumber() { return serialNumber; }
    public String getDescription() { return description; }
    public Money getDailyPrice() { return dailyPrice; }
    public Money getReplacementValue() { return replacementValue; }
    public ToolStatus getStatus() { return status; }
    public List<ToolImage> getImages() { return images; }
    public List<ToolSpecification> getSpecifications() { return specifications; }
}
