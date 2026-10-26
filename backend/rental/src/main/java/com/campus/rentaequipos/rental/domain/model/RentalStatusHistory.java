package com.campus.rentaequipos.rental.domain.model;

import java.time.LocalDateTime;
import java.util.UUID;

public class RentalStatusHistory {
    private final UUID id;
    private final UUID rentalId;
    private final String fromStatus;
    private final String toStatus;
    private final String changedBy;
    private final LocalDateTime changedAt;
    private final String notes;

    public RentalStatusHistory(UUID id, UUID rentalId, String fromStatus, String toStatus,
                               String changedBy, LocalDateTime changedAt, String notes) {
        this.id = id != null ? id : UUID.randomUUID();
        this.rentalId = rentalId;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.changedBy = changedBy != null ? changedBy : "SYSTEM";
        this.changedAt = changedAt != null ? changedAt : LocalDateTime.now();
        this.notes = notes;
    }

    public RentalStatusHistory(UUID rentalId, String fromStatus, String toStatus, String changedBy, String notes) {
        this(UUID.randomUUID(), rentalId, fromStatus, toStatus, changedBy, LocalDateTime.now(), notes);
    }

    public UUID getId() { return id; }
    public UUID getRentalId() { return rentalId; }
    public String getFromStatus() { return fromStatus; }
    public String getToStatus() { return toStatus; }
    public String getChangedBy() { return changedBy; }
    public LocalDateTime getChangedAt() { return changedAt; }
    public String getNotes() { return notes; }
}
