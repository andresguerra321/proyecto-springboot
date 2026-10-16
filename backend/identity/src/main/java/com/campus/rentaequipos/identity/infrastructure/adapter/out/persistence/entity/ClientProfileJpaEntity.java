package com.campus.rentaequipos.identity.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "client_profiles")
@Getter
@Setter
public class ClientProfileJpaEntity {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "document_type", nullable = false, length = 20)
    private String documentType;

    @Column(name = "document_number", nullable = false, unique = true, length = 50)
    private String documentNumber;

    @Column(name = "phone", nullable = false, length = 30)
    private String phone;

    @Column(name = "address", nullable = false, length = 200)
    private String address;

    @Column(name = "city", nullable = false, length = 100)
    private String city;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public ClientProfileJpaEntity() {
    }

    public ClientProfileJpaEntity(
            UUID id,
            UUID userId,
            String fullName,
            String documentType,
            String documentNumber,
            String phone,
            String address,
            String city,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        this.id = id;
        this.userId = userId;
        this.fullName = fullName;
        this.documentType = documentType;
        this.documentNumber = documentNumber;
        this.phone = phone;
        this.address = address;
        this.city = city;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
