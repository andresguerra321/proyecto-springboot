package com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "rental_status_history")
public class RentalStatusHistoryJpaEntity {

    @Id
    private UUID id;

    @Column(name = "rental_id", nullable = false)
    private UUID rentalId;

    @Column(name = "from_status", length = 30)
    private String fromStatus;

    @Column(name = "to_status", nullable = false, length = 30)
    private String toStatus;

    @Column(name = "changed_by", length = 100)
    private String changedBy;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;

    @Column(length = 255)
    private String notes;

    public RentalStatusHistoryJpaEntity() {}

    public RentalStatusHistoryJpaEntity(UUID id, UUID rentalId, String fromStatus, String toStatus,
                                        String changedBy, LocalDateTime changedAt, String notes) {
        this.id = id;
        this.rentalId = rentalId;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.changedBy = changedBy;
        this.changedAt = changedAt;
        this.notes = notes;
    }

    public UUID getId() { return id; }
    public UUID getRentalId() { return rentalId; }
    public String getFromStatus() { return fromStatus; }
    public String getToStatus() { return toStatus; }
    public String getChangedBy() { return changedBy; }
    public LocalDateTime getChangedAt() { return changedAt; }
    public String getNotes() { return notes; }
}
