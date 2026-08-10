package com.arogya.rural.service;

import com.arogya.rural.dto.request.CreatePrescriptionRequest;
import com.arogya.rural.dto.response.PrescriptionResponse;
import com.arogya.rural.entity.Doctor;
import com.arogya.rural.entity.MedicalRecord;
import com.arogya.rural.entity.Patient;
import com.arogya.rural.entity.Prescription;
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

import java.util.List;

@Service
@RequiredArgsConstructor
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final ResponseMapper responseMapper;

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> listPrescriptions(
            UserPrincipal currentUser,
            Long recordId,
            Long patientId,
            Long doctorId
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

        return prescriptionRepository.search(recordId, scopedPatientId, scopedDoctorId)
                .stream()
                .map(responseMapper::toPrescriptionResponse)
                .toList();
    }

    @Transactional
    public PrescriptionResponse createPrescription(UserPrincipal currentUser, CreatePrescriptionRequest request) {
        if (currentUser.getRole() == Role.PATIENT) {
            throw new AccessDeniedException("Patients cannot create prescriptions");
        }

        Long doctorId = resolveDoctorIdForWrite(currentUser, request.getDoctorId());
        if (request.getMedicalRecordId() == null
                || request.getPatientId() == null
                || doctorId == null
                || isBlank(request.getMedicines())
                || isBlank(request.getDosageInstructions())) {
            throw new BadRequestException("Missing fields");
        }

        MedicalRecord record = medicalRecordRepository.findById(request.getMedicalRecordId())
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found"));
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        if (!record.getPatient().getId().equals(patient.getId()) || !record.getDoctor().getId().equals(doctor.getId())) {
            throw new BadRequestException("Prescription must match the medical record patient and doctor");
        }

        Prescription prescription = new Prescription();
        prescription.setMedicalRecord(record);
        prescription.setPatient(patient);
        prescription.setDoctor(doctor);
        prescription.setMedicines(request.getMedicines().trim());
        prescription.setDosageInstructions(request.getDosageInstructions().trim());

        Prescription saved = prescriptionRepository.save(prescription);
        return responseMapper.toPrescriptionResponse(saved);
    }

    private Long resolveDoctorIdForWrite(UserPrincipal currentUser, Long requestedDoctorId) {
        if (currentUser.getRole() == Role.DOCTOR) {
            Doctor doctor = doctorRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new BadRequestException("Doctor profile not found"));
            if (requestedDoctorId != null && !requestedDoctorId.equals(doctor.getId())) {
                throw new AccessDeniedException("Cannot create prescriptions for another doctor");
            }
            return doctor.getId();
        }
        return requestedDoctorId;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
