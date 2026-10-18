package com.campus.rentaequipos.identity.application.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AuthResponse(
        String token,
        String type,
        String username
) {
    @JsonProperty("jwtToken")
    public String jwtToken() {
        return token;
    }
}
