package com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "rental_inspections")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RentalInspectionJpaEntity {

    @Id
    private UUID id;

    @Column(name = "rental_id", nullable = false)
    private UUID rentalId;

    @Column(name = "inspection_type", nullable = false, length = 20)
    private String inspectionType;

    @Column(name = "inspection_date", nullable = false)
    private LocalDateTime inspectionDate;

    @Column(name = "inspector_notes", columnDefinition = "TEXT")
    private String inspectorNotes;

    @Column(name = "inspector_user_id")
    private UUID inspectorUserId;

    @Column(name = "status", nullable = false, length = 30)
    private String status;
}
