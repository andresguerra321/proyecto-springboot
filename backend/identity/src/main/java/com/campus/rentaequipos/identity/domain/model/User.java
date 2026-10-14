package com.campus.rentaequipos.identity.domain.model;

import java.util.Set;
import java.util.UUID;

public class User {
    private UUID id;
    private String username;
    private String email;
    private String passwordHash;
    private boolean enabled;
    private Set<Role> roles;

    public User(UUID id, String username, String email, String passwordHash, boolean enabled, Set<Role> roles) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.enabled = enabled;
        this.roles = roles;
    }

    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public void changeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("El correo electrónico no puede estar vacío");
        }
        this.email = email.trim().toLowerCase();
    }

    public void changeRoles(Set<Role> roles) {
        if (roles == null || roles.isEmpty()) {
            throw new IllegalArgumentException("El usuario debe tener al menos un rol");
        }
        this.roles = roles;
    }

    public UUID getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public boolean isEnabled() { return enabled; }
    public Set<Role> getRoles() { return roles; }
}
