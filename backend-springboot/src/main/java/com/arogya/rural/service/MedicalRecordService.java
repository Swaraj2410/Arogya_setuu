package com.arogya.rural.service;

import com.arogya.rural.dto.request.CreateMedicalRecordRequest;
import com.arogya.rural.dto.request.UpdateMedicalRecordRequest;
import com.arogya.rural.dto.response.MedicalRecordResponse;
import com.arogya.rural.entity.Doctor;
import com.arogya.rural.entity.MedicalRecord;
import com.arogya.rural.entity.Patient;
import com.arogya.rural.enums.Role;
import com.arogya.rural.exception.BadRequestException;
import com.arogya.rural.exception.ResourceNotFoundException;
import com.arogya.rural.mapper.ResponseMapper;
import com.arogya.rural.repository.DoctorRepository;
import com.arogya.rural.repository.MedicalRecordRepository;
import com.arogya.rural.repository.PatientRepository;
import com.arogya.rural.repository.PrescriptionRepository;
import com.arogya.rural.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final ResponseMapper responseMapper;

    @Transactional(readOnly = true)
    public List<MedicalRecordResponse> listRecords(
            UserPrincipal currentUser,
            Long patientId,
            Long doctorId,
            LocalDate date,
            String queryText
    ) {
        Long scopedPatientId = patientId;
        Long scopedDoctorId = doctorId;

        if (currentUser.getRole() == Role.PATIENT) {
            Patient patient = patientRepository.findByUserId(currentUser.getId()).orElse(null);
            if (patient == null) {
                return List.of();
            }
            scopedPatientId = patient.getId();
        } else if (currentUser.getRole() == Role.DOCTOR) {
            Doctor doctor = doctorRepository.findByUserId(currentUser.getId()).orElse(null);
            if (doctor == null) {
                return List.of();
            }
            scopedDoctorId = doctor.getId();
        }

        String searchText = queryText == null || queryText.isBlank() ? null : queryText.trim();
        return medicalRecordRepository.search(scopedPatientId, scopedDoctorId, date, searchText)
                .stream()
                .map(record -> responseMapper.toMedicalRecordResponse(
                        record,
                        prescriptionRepository.findByMedicalRecordId(record.getId())
                ))
                .toList();
    }

    @Transactional
    public MedicalRecordResponse createRecord(UserPrincipal currentUser, CreateMedicalRecordRequest request) {
        if (currentUser.getRole() == Role.PATIENT) {
            throw new AccessDeniedException("Patients cannot create medical records");
        }

        Long doctorId = resolveDoctorIdForWrite(currentUser, request.getDoctorId(), "Cannot create records for another doctor");
        if (request.getPatientId() == null || doctorId == null || isBlank(request.getDiagnosis()) || request.getVisitDate() == null) {
            throw new BadRequestException("Missing fields");
        }

        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        MedicalRecord record = new MedicalRecord();
        record.setPatient(patient);
        record.setDoctor(doctor);
        record.setDiagnosis(request.getDiagnosis().trim());
        record.setTreatment(trimNullable(request.getTreatment()));
        record.setNotes(trimNullable(request.getNotes()));
        record.setVisitDate(request.getVisitDate());

        MedicalRecord saved = medicalRecordRepository.save(record);
        MedicalRecord withDetails = medicalRecordRepository.findByIdWithDetails(saved.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found"));
        return responseMapper.toMedicalRecordResponse(withDetails, List.of());
    }

    @Transactional
    public MedicalRecordResponse updateRecord(UserPrincipal currentUser, Long recordId, UpdateMedicalRecordRequest request) {
        MedicalRecord record = medicalRecordRepository.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Not found"));

        if (currentUser.getRole() == Role.PATIENT) {
            throw new AccessDeniedException("Patients cannot update medical records");
        }
        if (currentUser.getRole() == Role.DOCTOR) {
            Doctor doctor = doctorRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Not found"));
            if (!record.getDoctor().getId().equals(doctor.getId())) {
                throw new ResourceNotFoundException("Not found");
            }
        }

        if (request.getDiagnosis() != null) {
            record.setDiagnosis(request.getDiagnosis());
        }
        if (request.getTreatment() != null) {
            record.setTreatment(request.getTreatment());
        }
        if (request.getNotes() != null) {
            record.setNotes(request.getNotes());
        }
        if (request.getVisitDate() != null) {
            record.setVisitDate(request.getVisitDate());
        }

        MedicalRecord saved = medicalRecordRepository.save(record);
        MedicalRecord withDetails = medicalRecordRepository.findByIdWithDetails(saved.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found"));
        return responseMapper.toMedicalRecordResponse(
                withDetails,
                prescriptionRepository.findByMedicalRecordId(withDetails.getId())
        );
    }

    private Long resolveDoctorIdForWrite(UserPrincipal currentUser, Long requestedDoctorId, String forbiddenMessage) {
        if (currentUser.getRole() == Role.DOCTOR) {
            Doctor doctor = doctorRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new BadRequestException("Doctor profile not found"));
            if (requestedDoctorId != null && !requestedDoctorId.equals(doctor.getId())) {
                throw new AccessDeniedException(forbiddenMessage);
            }
            return doctor.getId();
        }
        return requestedDoctorId;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String trimNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }
}
