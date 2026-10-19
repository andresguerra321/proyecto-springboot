package com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "rentals")
public class RentalJpaEntity {

    @Id
    private UUID id;

    @Column(name = "rental_code", nullable = false, unique = true, length = 30)
    private String rentalCode;

    @Column(name = "client_id", nullable = false)
    private UUID clientId;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "total_days", nullable = false)
    private int totalDays;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal deposit;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "delivery_address", length = 200)
    private String deliveryAddress;

    @Column(name = "contact_phone", length = 30)
    private String contactPhone;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "rental_id", nullable = false)
    private List<RentalItemJpaEntity> items = new ArrayList<>();

    public RentalJpaEntity() {}

    public RentalJpaEntity(UUID id, String rentalCode, UUID clientId, LocalDate startDate, LocalDate endDate,
                           int totalDays, BigDecimal subtotal, BigDecimal deposit, BigDecimal totalAmount,
                           String status, List<RentalItemJpaEntity> items) {
        this(id, rentalCode, clientId, startDate, endDate, totalDays, subtotal, deposit, totalAmount, status, items, null, null);
    }

    public RentalJpaEntity(UUID id, String rentalCode, UUID clientId, LocalDate startDate, LocalDate endDate,
                           int totalDays, BigDecimal subtotal, BigDecimal deposit, BigDecimal totalAmount,
                           String status, List<RentalItemJpaEntity> items,
                           String deliveryAddress, String contactPhone) {
        this.id = id;
        this.rentalCode = rentalCode;
        this.clientId = clientId;
        this.startDate = startDate;
        this.endDate = endDate;
        this.totalDays = totalDays;
        this.subtotal = subtotal;
        this.deposit = deposit;
        this.totalAmount = totalAmount;
        this.status = status;
        this.items = items;
        this.deliveryAddress = deliveryAddress;
        this.contactPhone = contactPhone;
    }

    public UUID getId() { return id; }
    public String getRentalCode() { return rentalCode; }
    public UUID getClientId() { return clientId; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public int getTotalDays() { return totalDays; }
    public BigDecimal getSubtotal() { return subtotal; }
    public BigDecimal getDeposit() { return deposit; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public String getStatus() { return status; }
    public List<RentalItemJpaEntity> getItems() { return items; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public String getContactPhone() { return contactPhone; }
}
