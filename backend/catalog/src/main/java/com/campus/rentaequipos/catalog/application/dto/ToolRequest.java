package com.campus.rentaequipos.catalog.application.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record ToolRequest(
        UUID providerId,
        UUID categoryId,
        String name,
        String brand,
        String model,
        String serialNumber,
        String description,
        BigDecimal dailyPrice,
        BigDecimal replacementValue,
        List<ImageRequest> images,
        List<SpecificationRequest> specifications
) {
    public record ImageRequest(String imageUrl, boolean isPrimary) {}
    public record SpecificationRequest(String specName, String specValue) {}
}
