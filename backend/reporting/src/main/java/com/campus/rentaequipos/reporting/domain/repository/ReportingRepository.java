package com.campus.rentaequipos.reporting.domain.repository;

import com.campus.rentaequipos.reporting.domain.model.FrequentClientReport;
import com.campus.rentaequipos.reporting.domain.model.IncomeReport;
import com.campus.rentaequipos.reporting.domain.model.MostRentedToolReport;
import com.campus.rentaequipos.reporting.domain.model.ToolAvailabilityReport;

import java.util.List;

public interface ReportingRepository {
    IncomeReport generateIncomeReport();
    List<MostRentedToolReport> getMostRentedTools(int limit);
    List<FrequentClientReport> getFrequentClients(int limit);
    ToolAvailabilityReport getToolAvailabilityReport();
    com.campus.rentaequipos.reporting.domain.model.ProviderDashboardReport getProviderDashboardReport(java.util.UUID providerId);
    List<com.campus.rentaequipos.reporting.domain.model.OverdueRentalReport> getOverdueRentals();
    List<com.campus.rentaequipos.reporting.domain.model.DamageSummaryReport> getDamageSummaryByCategory();
}
