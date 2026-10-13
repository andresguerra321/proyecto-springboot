package com.campus.rentaequipos.rental.application.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record InspectionResponse(
        UUID id,
        UUID rentalId,
        String inspectionType,
        LocalDateTime inspectionDate,
        String inspectorNotes,
        UUID inspectorUserId,
        String status
) {}
