package com.campus.rentaequipos.identity.domain.model;

import java.time.LocalDateTime;
import java.util.UUID;

public class ClientProfile {
    private UUID id;
    private UUID userId;
    private String fullName;
    private String documentType;
    private String documentNumber;
    private String phone;
    private String address;
    private String city;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ClientProfile(UUID id, UUID userId, String fullName, String documentType,
                         String documentNumber, String phone, String address, String city,
                         LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.userId = userId;
        this.fullName = fullName;
        this.documentType = documentType;
        this.documentNumber = documentNumber;
        this.phone = phone;
        this.address = address;
        this.city = city;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
        this.updatedAt = updatedAt != null ? updatedAt : LocalDateTime.now();
    }

    public void update(String fullName, String phone, String address, String city) {
        this.fullName = fullName;
        this.phone = phone;
        this.address = address;
        this.city = city;
        this.updatedAt = LocalDateTime.now();
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getFullName() { return fullName; }
    public String getDocumentType() { return documentType; }
    public String getDocumentNumber() { return documentNumber; }
    public String getPhone() { return phone; }
    public String getAddress() { return address; }
    public String getCity() { return city; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
