package com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "warranty_claims")
@Getter
@Setter
public class WarrantyClaimJpaEntity {

    @Id
    private UUID id;

    @Column(name = "ticket_number", nullable = false, unique = true, length = 30)
    private String ticketNumber;

    @Column(name = "rental_id", nullable = false)
    private UUID rentalId;

    @Column(name = "tool_id")
    private UUID toolId;

    @Column(name = "claim_type", nullable = false, length = 30)
    private String claimType;

    @Column(name = "fault_type", nullable = false, length = 40)
    private String faultType;

    @Column(name = "urgency", nullable = false, length = 20)
    private String urgency;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "contact_phone", nullable = false, length = 30)
    private String contactPhone;

    @Column(name = "delivery_address", nullable = false, length = 200)
    private String deliveryAddress;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public WarrantyClaimJpaEntity() {
    }

    public WarrantyClaimJpaEntity(
            UUID id,
            String ticketNumber,
            UUID rentalId,
            UUID toolId,
            String claimType,
            String faultType,
            String urgency,
            String description,
            String contactPhone,
            String deliveryAddress,
            String status,
            String resolutionNotes,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        this.id = id;
        this.ticketNumber = ticketNumber;
        this.rentalId = rentalId;
        this.toolId = toolId;
        this.claimType = claimType;
        this.faultType = faultType;
        this.urgency = urgency;
        this.description = description;
        this.contactPhone = contactPhone;
        this.deliveryAddress = deliveryAddress;
        this.status = status;
        this.resolutionNotes = resolutionNotes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
