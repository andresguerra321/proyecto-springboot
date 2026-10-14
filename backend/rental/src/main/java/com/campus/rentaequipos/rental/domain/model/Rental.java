package com.campus.rentaequipos.rental.domain.model;

import com.campus.rentaequipos.shared.domain.valueobject.DateRange;
import com.campus.rentaequipos.shared.domain.valueobject.Money;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class Rental {
    private UUID id;
    private String rentalCode;
    private UUID clientId;
    private DateRange dateRange;
    private int totalDays;
    private Money subtotal;
    private Money deposit;
    private Money totalAmount;
    private RentalStatus status;
    private List<RentalItem> items;

    public Rental(UUID id, String rentalCode, UUID clientId, DateRange dateRange, int totalDays, 
                  Money subtotal, Money deposit, Money totalAmount, RentalStatus status, List<RentalItem> items) {
        this.id = id;
        this.rentalCode = rentalCode;
        this.clientId = clientId;
        this.dateRange = dateRange;
        this.totalDays = totalDays;
        this.subtotal = subtotal;
        this.deposit = deposit;
        this.totalAmount = totalAmount;
        this.status = status != null ? status : RentalStatus.PENDING;
        this.items = items != null ? items : new ArrayList<>();
    }

    public void confirm() {
        if (this.status == RentalStatus.CONFIRMED) {
            return;
        }
        if (this.status != RentalStatus.PENDING) {
            throw new IllegalStateException("Solo se pueden confirmar reservas en estado PENDING");
        }
        this.status = RentalStatus.CONFIRMED;
    }

    public void cancel() {
        if (this.status == RentalStatus.COMPLETED || this.status == RentalStatus.IN_PROGRESS) {
            throw new IllegalStateException("No se pueden cancelar reservas en curso o completadas");
        }
        this.status = RentalStatus.CANCELLED;
    }

    public void start() {
        if (this.status != RentalStatus.CONFIRMED) {
            throw new IllegalStateException("Solo se pueden iniciar reservas en estado CONFIRMED");
        }
        this.status = RentalStatus.IN_PROGRESS;
    }

    public void complete() {
        if (this.status != RentalStatus.IN_PROGRESS) {
            throw new IllegalStateException("Solo se pueden completar reservas en estado IN_PROGRESS");
        }
        this.status = RentalStatus.COMPLETED;
    }

    // Getters
    public UUID getId() { return id; }
    public String getRentalCode() { return rentalCode; }
    public UUID getClientId() { return clientId; }
    public DateRange getDateRange() { return dateRange; }
    public int getTotalDays() { return totalDays; }
    public Money getSubtotal() { return subtotal; }
    public Money getDeposit() { return deposit; }
    public Money getTotalAmount() { return totalAmount; }
    public RentalStatus getStatus() { return status; }
    public List<RentalItem> getItems() { return items; }
}
