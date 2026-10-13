package com.campus.rentaequipos.catalog.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "tools")
public class ToolJpaEntity {

    @Id
    private UUID id;

    @Column(name = "provider_id", nullable = false)
    private UUID providerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private CategoryJpaEntity category;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 100)
    private String brand;

    @Column(length = 100)
    private String model;

    @Column(name = "serial_number", unique = true, length = 100)
    private String serialNumber;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "daily_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal dailyPrice;

    @Column(name = "replacement_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal replacementValue;

    @Column(nullable = false, length = 30)
    private String status;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "tool_id", nullable = false)
    private List<ToolImageJpaEntity> images = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "tool_id", nullable = false)
    private List<ToolSpecificationJpaEntity> specifications = new ArrayList<>();

    public ToolJpaEntity() {}

    public ToolJpaEntity(UUID id, UUID providerId, CategoryJpaEntity category, String name, String brand,
                         String model, String serialNumber, String description, BigDecimal dailyPrice,
                         BigDecimal replacementValue, String status, List<ToolImageJpaEntity> images,
                         List<ToolSpecificationJpaEntity> specifications) {
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
        this.images = images;
        this.specifications = specifications;
    }

    public UUID getId() { return id; }
    public UUID getProviderId() { return providerId; }
    public CategoryJpaEntity getCategory() { return category; }
    public String getName() { return name; }
    public String getBrand() { return brand; }
    public String getModel() { return model; }
    public String getSerialNumber() { return serialNumber; }
    public String getDescription() { return description; }
    public BigDecimal getDailyPrice() { return dailyPrice; }
    public BigDecimal getReplacementValue() { return replacementValue; }
    public String getStatus() { return status; }
    public List<ToolImageJpaEntity> getImages() { return images; }
    public List<ToolSpecificationJpaEntity> getSpecifications() { return specifications; }
}
