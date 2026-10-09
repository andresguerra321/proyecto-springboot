package com.campus.rentaequipos.identity.domain.port;

import com.campus.rentaequipos.identity.domain.model.User;

public interface JwtTokenPort {
    String generateToken(User user);
    String extractUsername(String token);
    boolean isTokenValid(String token, User user);
}
