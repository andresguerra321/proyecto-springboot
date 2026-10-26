package com.campus.rentaequipos.reporting.infrastructure.adapter.out.persistence;

import com.campus.rentaequipos.reporting.domain.model.FrequentClientReport;
import com.campus.rentaequipos.reporting.domain.model.IncomeReport;
import com.campus.rentaequipos.reporting.domain.model.MostRentedToolReport;
import com.campus.rentaequipos.reporting.domain.repository.ReportingRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
public class ReportingRepositoryAdapter implements ReportingRepository {

    private final JdbcTemplate jdbcTemplate;

    public ReportingRepositoryAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public IncomeReport generateIncomeReport() {
        String query = """
                SELECT 
                    COALESCE(SUM(amount), 0) as total_income,
                    (SELECT COUNT(*) FROM rentals) as total_rentals,
                    (SELECT COUNT(*) FROM payments WHERE payment_status = 'COMPLETED') as total_payments
                FROM payments 
                WHERE payment_status = 'COMPLETED'
                """;
        
        return jdbcTemplate.queryForObject(query, (rs, rowNum) -> new IncomeReport(
                rs.getBigDecimal("total_income"),
                rs.getInt("total_rentals"),
                rs.getInt("total_payments")
        ));
    }

    @Override
    public List<MostRentedToolReport> getMostRentedTools(int limit) {
        String query = """
                SELECT t.id, t.name, COUNT(ri.tool_id) as times_rented
                FROM tools t
                JOIN rental_items ri ON t.id = ri.tool_id
                GROUP BY t.id, t.name
                ORDER BY times_rented DESC
                LIMIT ?
                """;

        return jdbcTemplate.query(query, (rs, rowNum) -> new MostRentedToolReport(
                UUID.fromString(rs.getString("id")),
                rs.getString("name"),
                rs.getLong("times_rented")
        ), limit);
    }

    @Override
    public List<FrequentClientReport> getFrequentClients(int limit) {
        String query = """
                SELECT c.id, u.email, COUNT(r.id) as total_rentals
                FROM client_profiles c
                JOIN users u ON c.user_id = u.id
                JOIN rentals r ON c.id = r.client_id
                GROUP BY c.id, u.email
                ORDER BY total_rentals DESC
                LIMIT ?
                """;

        return jdbcTemplate.query(query, (rs, rowNum) -> new FrequentClientReport(
                UUID.fromString(rs.getString("id")),
                rs.getString("email"),
                rs.getLong("total_rentals")
        ), limit);
    }

    @Override
    public com.campus.rentaequipos.reporting.domain.model.ToolAvailabilityReport getToolAvailabilityReport() {
        String query = """
                SELECT 
                    COUNT(*) as total_tools,
                    COUNT(CASE WHEN status = 'AVAILABLE' THEN 1 END) as available_tools,
                    COUNT(CASE WHEN status = 'RENTED' THEN 1 END) as rented_tools,
                    COUNT(CASE WHEN status = 'MAINTENANCE' THEN 1 END) as maintenance_tools,
                    COUNT(CASE WHEN status = 'RETIRED' THEN 1 END) as retired_tools
                FROM tools
                """;

        return jdbcTemplate.queryForObject(query, (rs, rowNum) -> new com.campus.rentaequipos.reporting.domain.model.ToolAvailabilityReport(
                rs.getLong("total_tools"),
                rs.getLong("available_tools"),
                rs.getLong("rented_tools"),
                rs.getLong("maintenance_tools"),
                rs.getLong("retired_tools")
        ));
    }

    @Override
    public com.campus.rentaequipos.reporting.domain.model.ProviderDashboardReport getProviderDashboardReport(UUID providerId) {
        String query = """
                SELECT 
                    (SELECT COUNT(*) FROM tools WHERE provider_id = ?) as total_tools,
                    (SELECT COUNT(*) FROM tools WHERE provider_id = ? AND status = 'RENTED') as rented_tools,
                    (SELECT COUNT(*) FROM tools WHERE provider_id = ? AND status = 'MAINTENANCE') as maintenance_tools,
                    (SELECT COALESCE(SUM(ri.total_price), 0)
                     FROM rental_items ri
                     JOIN tools t ON t.id = ri.tool_id
                     JOIN rentals r ON r.id = ri.rental_id
                     WHERE t.provider_id = ? AND r.status IN ('CONFIRMED', 'IN_PROGRESS', 'COMPLETED')) as total_earnings,
                    (SELECT COUNT(DISTINCT r.id)
                     FROM rentals r
                     JOIN rental_items ri ON ri.rental_id = r.id
                     JOIN tools t ON t.id = ri.tool_id
                     WHERE t.provider_id = ? AND r.status = 'PENDING') as pending_rentals,
                    (SELECT COUNT(DISTINCT r.id)
                     FROM rentals r
                     JOIN rental_items ri ON ri.rental_id = r.id
                     JOIN tools t ON t.id = ri.tool_id
                     WHERE t.provider_id = ? AND r.status = 'IN_PROGRESS') as active_rentals
                """;

        return jdbcTemplate.queryForObject(query, (rs, rowNum) -> new com.campus.rentaequipos.reporting.domain.model.ProviderDashboardReport(
                providerId,
                rs.getLong("total_tools"),
                rs.getLong("rented_tools"),
                rs.getLong("maintenance_tools"),
                rs.getBigDecimal("total_earnings"),
                rs.getLong("pending_rentals"),
                rs.getLong("active_rentals")
        ), providerId, providerId, providerId, providerId, providerId, providerId);
    }

    @Override
    public List<com.campus.rentaequipos.reporting.domain.model.OverdueRentalReport> getOverdueRentals() {
        String query = """
                SELECT r.id, r.rental_code, c.full_name, c.phone, r.end_date,
                       COALESCE((SELECT SUM(ri.daily_price) FROM rental_items ri WHERE ri.rental_id = r.id), 0) AS daily_sum
                FROM rentals r
                JOIN client_profiles c ON c.id = r.client_id
                WHERE r.status = 'IN_PROGRESS' AND r.end_date < CURRENT_DATE
                ORDER BY r.end_date ASC
                """;
        java.time.LocalDate today = java.time.LocalDate.now();
        java.math.BigDecimal factor = new java.math.BigDecimal("1.5");
        return jdbcTemplate.query(query, (rs, rowNum) -> {
            java.time.LocalDate end = rs.getDate("end_date").toLocalDate();
            int days = (int) java.time.temporal.ChronoUnit.DAYS.between(end, today);
            java.math.BigDecimal penalty = rs.getBigDecimal("daily_sum")
                    .multiply(java.math.BigDecimal.valueOf(days))
                    .multiply(factor)
                    .setScale(2, java.math.RoundingMode.HALF_UP);
            return new com.campus.rentaequipos.reporting.domain.model.OverdueRentalReport(
                    UUID.fromString(rs.getString("id")),
                    rs.getString("rental_code"),
                    rs.getString("full_name"),
                    rs.getString("phone"),
                    end,
                    days,
                    penalty);
        });
    }

    @Override
    public List<com.campus.rentaequipos.reporting.domain.model.DamageSummaryReport> getDamageSummaryByCategory() {
        String query = """
                SELECT cat.name AS category_name,
                       COUNT(d.id) AS total_damages,
                       SUM(CASE WHEN d.severity = 'TOTAL_LOSS' THEN 1 ELSE 0 END) AS total_loss_count,
                       COALESCE(SUM(d.repair_cost), 0) AS total_repair_cost,
                       COALESCE(SUM(CASE WHEN d.is_charged_to_client THEN d.repair_cost ELSE 0 END), 0) AS charged_to_clients
                FROM damage_reports d
                JOIN tools t ON t.id = d.tool_id
                JOIN categories cat ON cat.id = t.category_id
                GROUP BY cat.name
                ORDER BY total_repair_cost DESC
                """;
        return jdbcTemplate.query(query, (rs, rowNum) -> new com.campus.rentaequipos.reporting.domain.model.DamageSummaryReport(
                rs.getString("category_name"),
                rs.getLong("total_damages"),
                rs.getLong("total_loss_count"),
                rs.getBigDecimal("total_repair_cost"),
                rs.getBigDecimal("charged_to_clients")
        ));
    }
}
