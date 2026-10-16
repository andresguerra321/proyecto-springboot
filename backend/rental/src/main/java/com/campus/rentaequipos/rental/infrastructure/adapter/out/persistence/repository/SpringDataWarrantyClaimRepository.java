package com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence.repository;

import com.campus.rentaequipos.rental.infrastructure.adapter.out.persistence.entity.WarrantyClaimJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SpringDataWarrantyClaimRepository extends JpaRepository<WarrantyClaimJpaEntity, UUID> {

    Optional<WarrantyClaimJpaEntity> findByTicketNumber(String ticketNumber);

    List<WarrantyClaimJpaEntity> findByRentalIdOrderByCreatedAtDesc(UUID rentalId);

    List<WarrantyClaimJpaEntity> findAllByOrderByCreatedAtDesc();

    @Query(value = "SELECT DISTINCT wc.* FROM warranty_claims wc " +
                   "JOIN rental_items ri ON wc.rental_id = ri.rental_id " +
                   "JOIN tools t ON ri.tool_id = t.id " +
                   "WHERE t.provider_id = :providerId " +
                   "ORDER BY wc.created_at DESC", nativeQuery = true)
    List<WarrantyClaimJpaEntity> findByProviderId(@Param("providerId") UUID providerId);
}
