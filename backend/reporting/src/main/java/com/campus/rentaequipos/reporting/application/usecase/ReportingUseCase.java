package com.campus.rentaequipos.reporting.application.usecase;

import com.campus.rentaequipos.reporting.domain.model.FrequentClientReport;
import com.campus.rentaequipos.reporting.domain.model.IncomeReport;
import com.campus.rentaequipos.reporting.domain.model.MostRentedToolReport;
import com.campus.rentaequipos.reporting.domain.repository.ReportingRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReportingUseCase {

    private final ReportingRepository reportingRepository;

    public ReportingUseCase(ReportingRepository reportingRepository) {
        this.reportingRepository = reportingRepository;
    }

    public IncomeReport getIncomeReport() {
        return reportingRepository.generateIncomeReport();
    }

    public List<MostRentedToolReport> getMostRentedTools(int limit) {
        return reportingRepository.getMostRentedTools(limit);
    }

    public List<FrequentClientReport> getFrequentClients(int limit) {
        return reportingRepository.getFrequentClients(limit);
    }
}
