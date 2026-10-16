package com.campus.rentaequipos.rental.application.dto;

public record UpdateClaimStatusRequest(
        String status,
        String notes
) {}
