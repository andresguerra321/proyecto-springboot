package com.campus.rentaequipos.rental.domain.model;

import com.campus.rentaequipos.shared.domain.valueobject.Money;
import java.util.UUID;

public class RentalItem {
    private UUID id;
    private UUID toolId;
    private Money dailyPrice;
    private Money totalPrice;
    private RentalItemStatus status;

    public RentalItem(UUID id, UUID toolId, Money dailyPrice, Money totalPrice, RentalItemStatus status) {
        this.id = id;
        this.toolId = toolId;
        this.dailyPrice = dailyPrice;
        this.totalPrice = totalPrice;
        this.status = status != null ? status : RentalItemStatus.RESERVED;
    }

    public UUID getId() { return id; }
    public UUID getToolId() { return toolId; }
    public Money getDailyPrice() { return dailyPrice; }
    public Money getTotalPrice() { return totalPrice; }
    public RentalItemStatus getStatus() { return status; }
    
    public void updateStatus(RentalItemStatus newStatus) {
        this.status = newStatus;
    }
}
