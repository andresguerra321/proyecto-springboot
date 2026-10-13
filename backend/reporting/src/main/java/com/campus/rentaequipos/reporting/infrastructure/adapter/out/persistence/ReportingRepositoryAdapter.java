package com.campus.rentaequipos.reporting.infrastructure.adapter.out.persistence;

import com.campus.rentaequipos.reporting.domain.model.FrequentClientReport;
import com.campus.rentaequipos.reporting.domain.model.IncomeReport;
import com.campus.rentaequipos.reporting.domain.model.MostRentedToolReport;
import com.campus.rentaequipos.reporting.domain.repository.ReportingRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
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
                SELECT u.id, u.email, COUNT(r.id) as total_rentals
                FROM app_users u
                JOIN rentals r ON u.id = r.client_id
                GROUP BY u.id, u.email
                ORDER BY total_rentals DESC
                LIMIT ?
                """;

        return jdbcTemplate.query(query, (rs, rowNum) -> new FrequentClientReport(
                UUID.fromString(rs.getString("id")),
                rs.getString("email"),
                rs.getLong("total_rentals")
        ), limit);
    }
}
