package com.campus.rentaequipos.rental.domain.model;

import java.time.LocalDateTime;
import java.util.UUID;

public class RentalInspection {
    private UUID id;
    private UUID rentalId;
    private String inspectionType; // DELIVERY, RETURN
    private LocalDateTime inspectionDate;
    private String inspectorNotes;
    private UUID inspectorUserId;
    private String status; // PASSED, WITH_OBSERVATIONS, DAMAGED

    public RentalInspection(UUID id, UUID rentalId, String inspectionType, LocalDateTime inspectionDate,
                            String inspectorNotes, UUID inspectorUserId, String status) {
        this.id = id;
        this.rentalId = rentalId;
        this.inspectionType = inspectionType;
        this.inspectionDate = inspectionDate != null ? inspectionDate : LocalDateTime.now();
        this.inspectorNotes = inspectorNotes;
        this.inspectorUserId = inspectorUserId;
        this.status = status != null ? status : "PASSED";
    }

    public UUID getId() { return id; }
    public UUID getRentalId() { return rentalId; }
    public String getInspectionType() { return inspectionType; }
    public LocalDateTime getInspectionDate() { return inspectionDate; }
    public String getInspectorNotes() { return inspectorNotes; }
    public UUID getInspectorUserId() { return inspectorUserId; }
    public String getStatus() { return status; }
}
