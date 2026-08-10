package com.arogya.rural.service;

import com.arogya.rural.dto.response.ReportSummaryResponse;
import com.arogya.rural.dto.response.SpecializationReportResponse;
import com.arogya.rural.entity.Specialization;
import com.arogya.rural.enums.AppointmentStatus;
import com.arogya.rural.repository.AppointmentRepository;
import com.arogya.rural.repository.DoctorRepository;
import com.arogya.rural.repository.MedicalRecordRepository;
import com.arogya.rural.repository.SpecializationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final AppointmentRepository appointmentRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final SpecializationRepository specializationRepository;
    private final DoctorRepository doctorRepository;

    @Transactional(readOnly = true)
    public ReportSummaryResponse summary(LocalDate from, LocalDate to) {
        Map<String, Long> appointmentCounts = new LinkedHashMap<>();
        appointmentCounts.put("booked", countAppointments(AppointmentStatus.BOOKED, from, to));
        appointmentCounts.put("completed", countAppointments(AppointmentStatus.COMPLETED, from, to));
        appointmentCounts.put("cancelled", countAppointments(AppointmentStatus.CANCELLED, from, to));

        List<SpecializationReportResponse> bySpecialization = specializationRepository.findAllOrdered()
                .stream()
                .map(this::toSpecializationReport)
                .toList();

        return new ReportSummaryResponse(
                appointmentCounts,
                medicalRecordRepository.count(),
                bySpecialization
        );
    }

    private long countAppointments(AppointmentStatus status, LocalDate from, LocalDate to) {
        if (from != null && to != null) {
            return appointmentRepository.countByStatusAndAppointmentDateBetween(status, from, to);
        }
        return appointmentRepository.countByStatus(status);
    }

    private SpecializationReportResponse toSpecializationReport(Specialization specialization) {
        return new SpecializationReportResponse(
                specialization.getName(),
                doctorRepository.countBySpecializationId(specialization.getId())
        );
    }
}
