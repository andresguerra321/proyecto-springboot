package com.campus.rentaequipos.rental.infrastructure.adapter.in.scheduled;

import com.campus.rentaequipos.rental.application.usecase.RentalUseCase;
import com.campus.rentaequipos.rental.domain.model.Rental;
import com.campus.rentaequipos.rental.domain.model.RentalStatus;
import com.campus.rentaequipos.rental.domain.repository.RentalRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class RentalExpirationScheduler {

    private static final Logger log = LoggerFactory.getLogger(RentalExpirationScheduler.class);

    private final RentalRepository rentalRepository;
    private final RentalUseCase rentalUseCase;

    public RentalExpirationScheduler(RentalRepository rentalRepository, RentalUseCase rentalUseCase) {
        this.rentalRepository = rentalRepository;
        this.rentalUseCase = rentalUseCase;
    }

    /**
     * Revisa cada 15 minutos si hay reservas PENDING cuya fecha de inicio ya expiró o pasó
     * y las rechaza automáticamente para liberar cualquier bloqueo.
     */
    @Scheduled(fixedDelay = 900000, initialDelay = 10000)
    public void expireOutdatedPendingRentals() {
        LocalDate today = LocalDate.now();
        List<Rental> pendingRentals = rentalRepository.findAll().stream()
                .filter(r -> r.getStatus() == RentalStatus.PENDING)
                .filter(r -> r.getDateRange().getStartDate().isBefore(today))
                .toList();

        for (Rental r : pendingRentals) {
            try {
                rentalUseCase.rechazarReserva(r.getId(), "Expiración automática: la fecha de inicio (" + r.getDateRange().getStartDate() + ") venció sin aprobación.", "SYSTEM");
                log.info("Reserva {} expirada automáticamente por vencimiento de fecha de inicio.", r.getRentalCode());
            } catch (Exception e) {
                log.warn("No se pudo expirar automáticamente la reserva {}: {}", r.getId(), e.getMessage());
            }
        }
    }
}
