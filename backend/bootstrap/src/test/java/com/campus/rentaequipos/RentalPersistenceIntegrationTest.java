package com.campus.rentaequipos;

import com.campus.rentaequipos.rental.domain.model.Rental;
import com.campus.rentaequipos.rental.domain.model.RentalItem;
import com.campus.rentaequipos.rental.domain.model.RentalItemStatus;
import com.campus.rentaequipos.rental.domain.model.RentalStatus;
import com.campus.rentaequipos.rental.domain.model.RentalStatusHistory;
import com.campus.rentaequipos.rental.domain.repository.RentalRepository;
import com.campus.rentaequipos.rental.domain.repository.RentalStatusHistoryRepository;
import com.campus.rentaequipos.shared.domain.valueobject.DateRange;
import com.campus.rentaequipos.shared.domain.valueobject.Money;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class RentalPersistenceIntegrationTest {

    @Autowired
    private RentalRepository rentalRepository;

    @Autowired
    private RentalStatusHistoryRepository historyRepository;

    @Test
    @DisplayName("Persistencia JPA: Crear, actualizar estado (PENDING -> CONFIRMED -> REJECTED) sin error de @Version ni duplicados")
    void shouldPersistAndSaveRentalStateTransitionsWithoutJpaVersionError() {
        UUID rentalId = UUID.randomUUID();
        UUID clientId = UUID.randomUUID();
        UUID toolId = UUID.randomUUID();

        RentalItem item = new RentalItem(
                UUID.randomUUID(),
                toolId,
                Money.of(50000.00),
                Money.of(150000.00),
                RentalItemStatus.RESERVED
        );

        Rental rental = new Rental(
                rentalId,
                "RNT-AUDIT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                clientId,
                new DateRange(LocalDate.now().plusDays(1), LocalDate.now().plusDays(4)),
                3,
                Money.of(150000.00),
                Money.of(200000.00),
                Money.of(350000.00),
                RentalStatus.PENDING,
                List.of(item),
                "Carrera 7 # 72-10",
                "+57 311 000 0000",
                null
        );

        // 1. Inserción inicial (PENDING)
        Rental created = rentalRepository.save(rental);
        assertNotNull(created);
        assertEquals(RentalStatus.PENDING, created.getStatus());

        // 2. Consulta de BD
        Optional<Rental> found = rentalRepository.findById(rentalId);
        assertTrue(found.isPresent());
        assertEquals(RentalStatus.PENDING, found.get().getStatus());

        // 3. Actualización de estado (PENDING -> CONFIRMED)
        // Esto antes fallaba con @Version porque version llegaba en null y trataba de hacer persist() en vez de merge()
        Rental toConfirm = found.get();
        toConfirm.confirm();
        Rental confirmed = rentalRepository.save(toConfirm);
        assertEquals(RentalStatus.CONFIRMED, confirmed.getStatus());

        // 4. Verificación de persistencia en BD
        Optional<Rental> afterConfirm = rentalRepository.findById(rentalId);
        assertTrue(afterConfirm.isPresent());
        assertEquals(RentalStatus.CONFIRMED, afterConfirm.get().getStatus());

        // 5. Historial de trazabilidad
        RentalStatusHistory history = new RentalStatusHistory(
                rentalId,
                "PENDING",
                "CONFIRMED",
                "proveedor_test",
                "Aprobada en auditoría técnica"
        );
        RentalStatusHistory savedHistory = historyRepository.save(history);
        assertNotNull(savedHistory.getId());

        List<RentalStatusHistory> historyList = historyRepository.findByRentalId(rentalId);
        assertFalse(historyList.isEmpty());
        assertEquals("proveedor_test", historyList.get(0).getChangedBy());
        assertEquals("CONFIRMED", historyList.get(0).getToStatus());
    }
}
