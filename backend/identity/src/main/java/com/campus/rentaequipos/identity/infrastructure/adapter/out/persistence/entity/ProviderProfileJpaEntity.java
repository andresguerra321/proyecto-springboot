package com.campus.rentaequipos.identity.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "provider_profiles")
@Getter
@Setter
public class ProviderProfileJpaEntity {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "company_name", nullable = false, length = 150)
    private String companyName;

    @Column(name = "tax_id", nullable = false, unique = true, length = 50)
    private String taxId;

    @Column(name = "phone", nullable = false, length = 30)
    private String phone;

    @Column(name = "address", nullable = false, length = 200)
    private String address;

    @Column(name = "city", nullable = false, length = 100)
    private String city;

    @Column(name = "is_verified", nullable = false)
    private boolean isVerified;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public ProviderProfileJpaEntity() {
    }

    public ProviderProfileJpaEntity(
            UUID id,
            UUID userId,
            String companyName,
            String taxId,
            String phone,
            String address,
            String city,
            boolean isVerified,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        this.id = id;
        this.userId = userId;
        this.companyName = companyName;
        this.taxId = taxId;
        this.phone = phone;
        this.address = address;
        this.city = city;
        this.isVerified = isVerified;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
