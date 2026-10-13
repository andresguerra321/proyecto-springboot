package com.campus.rentaequipos.reporting.domain.repository;

import com.campus.rentaequipos.reporting.domain.model.FrequentClientReport;
import com.campus.rentaequipos.reporting.domain.model.IncomeReport;
import com.campus.rentaequipos.reporting.domain.model.MostRentedToolReport;

import java.util.List;

public interface ReportingRepository {
    IncomeReport generateIncomeReport();
    List<MostRentedToolReport> getMostRentedTools(int limit);
    List<FrequentClientReport> getFrequentClients(int limit);
}
