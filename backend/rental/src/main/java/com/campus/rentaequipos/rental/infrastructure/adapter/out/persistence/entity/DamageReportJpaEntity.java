package com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "damage_reports")
@Getter
@Setter
public class DamageReportJpaEntity {

    @Id
    private UUID id;

    @Column(name = "inspection_id", nullable = false)
    private UUID inspectionId;

    @Column(name = "tool_id", nullable = false)
    private UUID toolId;

    @Column(name = "severity", nullable = false, length = 20)
    private String severity;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "repair_cost", nullable = false, precision = 12, scale = 2)
    private BigDecimal repairCost;

    @Column(name = "is_charged_to_client", nullable = false)
    private boolean isChargedToClient;

    public DamageReportJpaEntity() {
    }

    public DamageReportJpaEntity(
            UUID id,
            UUID inspectionId,
            UUID toolId,
            String severity,
            String description,
            BigDecimal repairCost,
            boolean isChargedToClient
    ) {
        this.id = id;
        this.inspectionId = inspectionId;
        this.toolId = toolId;
        this.severity = severity;
        this.description = description;
        this.repairCost = repairCost;
        this.isChargedToClient = isChargedToClient;
    }
}
