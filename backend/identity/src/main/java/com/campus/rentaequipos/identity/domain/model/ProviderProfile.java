package com.campus.rentaequipos.identity.domain.model;

import java.time.LocalDateTime;
import java.util.UUID;

public class ProviderProfile {
    private UUID id;
    private UUID userId;
    private String companyName;
    private String taxId;
    private String phone;
    private String address;
    private String city;
    private boolean isVerified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ProviderProfile(UUID id, UUID userId, String companyName, String taxId,
                           String phone, String address, String city, boolean isVerified,
                           LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.userId = userId;
        this.companyName = companyName;
        this.taxId = taxId;
        this.phone = phone;
        this.address = address;
        this.city = city;
        this.isVerified = isVerified;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
        this.updatedAt = updatedAt != null ? updatedAt : LocalDateTime.now();
    }

    public void update(String companyName, String phone, String address, String city) {
        this.companyName = companyName;
        this.phone = phone;
        this.address = address;
        this.city = city;
        this.updatedAt = LocalDateTime.now();
    }

    public void verify() {
        this.isVerified = true;
        this.updatedAt = LocalDateTime.now();
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getCompanyName() { return companyName; }
    public String getTaxId() { return taxId; }
    public String getPhone() { return phone; }
    public String getAddress() { return address; }
    public String getCity() { return city; }
    public boolean isVerified() { return isVerified; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
