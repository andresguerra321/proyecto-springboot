package com.campus.rentaequipos.rental.application.dto;

import java.util.UUID;

public record InspectionRequest(
        UUID rentalId,
        String inspectionType, // DELIVERY, RETURN
        String inspectorNotes,
        UUID inspectorUserId,
        String status // PASSED, WITH_OBSERVATIONS, DAMAGED
) {}
