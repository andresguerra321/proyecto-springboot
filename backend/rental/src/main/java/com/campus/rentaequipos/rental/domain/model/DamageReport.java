package com.campus.rentaequipos.rental.domain.model;

import com.campus.rentaequipos.shared.domain.valueobject.Money;

import java.util.UUID;

public class DamageReport {
    private UUID id;
    private UUID inspectionId;
    private UUID toolId;
    private String severity; // MINOR, MODERATE, SEVERE, TOTAL_LOSS
    private String description;
    private Money repairCost;
    private boolean isChargedToClient;

    public DamageReport(UUID id, UUID inspectionId, UUID toolId, String severity,
                        String description, Money repairCost, boolean isChargedToClient) {
        this.id = id;
        this.inspectionId = inspectionId;
        this.toolId = toolId;
        this.severity = severity;
        this.description = description;
        this.repairCost = repairCost != null ? repairCost : Money.ZERO;
        this.isChargedToClient = isChargedToClient;
    }

    public UUID getId() { return id; }
    public UUID getInspectionId() { return inspectionId; }
    public UUID getToolId() { return toolId; }
    public String getSeverity() { return severity; }
    public String getDescription() { return description; }
    public Money getRepairCost() { return repairCost; }
    public boolean isChargedToClient() { return isChargedToClient; }
}
