package com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "rental_items")
public class RentalItemJpaEntity {

    @Id
    private UUID id;

    @Column(name = "rental_id", nullable = false, insertable = false, updatable = false)
    private UUID rentalId;

    @Column(name = "tool_id", nullable = false)
    private UUID toolId;

    @Column(name = "daily_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal dailyPrice;

    @Column(name = "total_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPrice;

    @Column(nullable = false, length = 30)
    private String status;

    public RentalItemJpaEntity() {}

    public RentalItemJpaEntity(UUID id, UUID rentalId, UUID toolId, BigDecimal dailyPrice, BigDecimal totalPrice, String status) {
        this.id = id;
        this.rentalId = rentalId;
        this.toolId = toolId;
        this.dailyPrice = dailyPrice;
        this.totalPrice = totalPrice;
        this.status = status;
    }

    public UUID getId() { return id; }
    public UUID getRentalId() { return rentalId; }
    public UUID getToolId() { return toolId; }
    public BigDecimal getDailyPrice() { return dailyPrice; }
    public BigDecimal getTotalPrice() { return totalPrice; }
    public String getStatus() { return status; }
}
