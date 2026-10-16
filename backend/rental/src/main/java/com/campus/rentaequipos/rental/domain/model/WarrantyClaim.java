package com.campus.rentaequipos.rental.domain.model;

import java.time.LocalDateTime;
import java.util.UUID;

public class WarrantyClaim {
    private UUID id;
    private String ticketNumber;
    private UUID rentalId;
    private UUID toolId;
    private String claimType; // EXCHANGE, WARRANTY_REPAIR, REFUND
    private String faultType; // MOTOR, ELECTRICO, HIDRAULICO, CONSUMIBLE, DIFERENTE, ESTRUCTURAL, OTHER
    private String urgency;   // URGENT, NORMAL
    private String description;
    private String contactPhone;
    private String deliveryAddress;
    private String status;    // OPEN, APPROVED, DISPATCHED, RESOLVED, REJECTED
    private String resolutionNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public WarrantyClaim(UUID id, String ticketNumber, UUID rentalId, UUID toolId, String claimType,
                         String faultType, String urgency, String description, String contactPhone,
                         String deliveryAddress, String status, String resolutionNotes,
                         LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.ticketNumber = ticketNumber;
        this.rentalId = rentalId;
        this.toolId = toolId;
        this.claimType = claimType;
        this.faultType = faultType;
        this.urgency = urgency != null ? urgency : "NORMAL";
        this.description = description;
        this.contactPhone = contactPhone;
        this.deliveryAddress = deliveryAddress;
        this.status = status != null ? status : "OPEN";
        this.resolutionNotes = resolutionNotes;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
        this.updatedAt = updatedAt != null ? updatedAt : LocalDateTime.now();
    }

    public UUID getId() { return id; }
    public String getTicketNumber() { return ticketNumber; }
    public UUID getRentalId() { return rentalId; }
    public UUID getToolId() { return toolId; }
    public String getClaimType() { return claimType; }
    public String getFaultType() { return faultType; }
    public String getUrgency() { return urgency; }
    public String getDescription() { return description; }
    public String getContactPhone() { return contactPhone; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public String getStatus() { return status; }
    public String getResolutionNotes() { return resolutionNotes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void updateStatus(String newStatus, String notes) {
        this.status = newStatus;
        if (notes != null && !notes.isBlank()) {
            this.resolutionNotes = notes;
        }
        this.updatedAt = LocalDateTime.now();
    }
}
