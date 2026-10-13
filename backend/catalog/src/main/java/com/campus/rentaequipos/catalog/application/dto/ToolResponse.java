package com.campus.rentaequipos.catalog.application.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record ToolResponse(
        UUID id,
        UUID providerId,
        CategoryResponse category,
        String name,
        String brand,
        String model,
        String serialNumber,
        String description,
        BigDecimal dailyPrice,
        BigDecimal replacementValue,
        String status,
        List<ImageResponse> images,
        List<SpecificationResponse> specifications
) {
    public record ImageResponse(UUID id, String imageUrl, boolean isPrimary) {}
    public record SpecificationResponse(UUID id, String specName, String specValue) {}
}
