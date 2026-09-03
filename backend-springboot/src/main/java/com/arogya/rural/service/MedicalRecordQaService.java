package com.arogya.rural.service;

import com.arogya.rural.dto.request.MedicalRecordQuestionRequest;
import com.arogya.rural.dto.response.MedicalRecordQaResponse;
import com.arogya.rural.entity.Doctor;
import com.arogya.rural.entity.MedicalRecord;
import com.arogya.rural.entity.Patient;
import com.arogya.rural.entity.Prescription;
import com.arogya.rural.enums.Role;
import com.arogya.rural.exception.BadRequestException;
import com.arogya.rural.exception.ResourceNotFoundException;
import com.arogya.rural.repository.AppointmentRepository;
import com.arogya.rural.repository.DoctorRepository;
import com.arogya.rural.repository.MedicalRecordRepository;
import com.arogya.rural.repository.PatientRepository;
import com.arogya.rural.repository.PrescriptionRepository;
import com.arogya.rural.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MedicalRecordQaService {

    private final FastApiMedicalRecordRagClient ragClient;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;

    @Transactional(readOnly = true)
    public MedicalRecordQaResponse ask(
            UserPrincipal currentUser,
            Long patientId,
            MedicalRecordQuestionRequest request
    ) {
        Doctor doctor = resolveDoctor(currentUser);
        Patient patient = patientRepository.findByIdWithUser(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        ensureDoctorCanAccessPatient(doctor.getId(), patient.getId());

        String question = normalizeQuestion(request.getQuestion());
        List<MedicalRecord> records = medicalRecordRepository.search(patient.getId(), doctor.getId(), null, null);
        if (records.isEmpty()) {
            throw new ResourceNotFoundException("No medical records are available for this patient");
        }

        List<FastApiMedicalRecordRagClient.RagDocument> documents = buildDocuments(patient, records);
        if (documents.isEmpty()) {
            throw new ResourceNotFoundException("No medical record content is available for this patient");
        }

        return ragClient.ask(patient.getId(), question, documents);
    }

    private Doctor resolveDoctor(UserPrincipal currentUser) {
        if (currentUser == null || currentUser.getRole() != Role.DOCTOR) {
            throw new AccessDeniedException("Only doctors can ask questions about medical records");
        }

        return doctorRepository.findByUserIdWithDetails(currentUser.getId())
                .orElseThrow(() -> new BadRequestException("Doctor profile not found"));
    }

    private void ensureDoctorCanAccessPatient(Long doctorId, Long patientId) {
        boolean hasRecord = medicalRecordRepository.existsByDoctorIdAndPatientId(doctorId, patientId);
        boolean hasAppointment = appointmentRepository.existsByDoctorIdAndPatientId(doctorId, patientId);
        if (!hasRecord && !hasAppointment) {
            throw new AccessDeniedException("Doctor is not authorized to access this patient's medical records");
        }
    }

    private List<FastApiMedicalRecordRagClient.RagDocument> buildDocuments(Patient patient, List<MedicalRecord> records) {
        List<FastApiMedicalRecordRagClient.RagDocument> documents = new ArrayList<>();
        for (MedicalRecord record : records) {
            documents.add(medicalRecordDocument(patient, record));
            for (Prescription prescription : prescriptionRepository.findByMedicalRecordId(record.getId())) {
                documents.add(prescriptionDocument(patient, record, prescription));
            }
        }
        return documents;
    }

    private FastApiMedicalRecordRagClient.RagDocument medicalRecordDocument(Patient patient, MedicalRecord record) {
        String visitDate = record.getVisitDate() == null ? "" : record.getVisitDate().toString();
        String text = String.join("\n",
                "Medical Visit",
                "Medical Record ID: " + record.getId(),
                "Patient: " + patientName(patient),
                "Doctor: " + doctorName(record),
                "Visit Date: " + valueOrMissing(visitDate),
                "Diagnosis: " + valueOrMissing(record.getDiagnosis()),
                "Treatment: " + valueOrMissing(record.getTreatment()),
                "Notes: " + valueOrMissing(record.getNotes())
        );

        return new FastApiMedicalRecordRagClient.RagDocument(
                "medical-record-" + record.getId(),
                "MEDICAL_RECORD",
                text,
                metadata(record.getPatient().getId(), record.getId(), null, visitDate, "MEDICAL_RECORD")
        );
    }

    private FastApiMedicalRecordRagClient.RagDocument prescriptionDocument(
            Patient patient,
            MedicalRecord record,
            Prescription prescription
    ) {
        String visitDate = record.getVisitDate() == null ? "" : record.getVisitDate().toString();
        String text = String.join("\n",
                "Prescription",
                "Prescription ID: " + prescription.getId(),
                "Medical Record ID: " + record.getId(),
                "Patient: " + patientName(patient),
                "Doctor: " + doctorName(record),
                "Visit Date: " + valueOrMissing(visitDate),
                "Medicines: " + valueOrMissing(prescription.getMedicines()),
                "Dosage Instructions: " + valueOrMissing(prescription.getDosageInstructions())
        );

        return new FastApiMedicalRecordRagClient.RagDocument(
                "prescription-" + prescription.getId(),
                "PRESCRIPTION",
                text,
                metadata(record.getPatient().getId(), record.getId(), prescription.getId(), visitDate, "PRESCRIPTION")
        );
    }

    private Map<String, Object> metadata(
            Long patientId,
            Long medicalRecordId,
            Long prescriptionId,
            String visitDate,
            String recordType
    ) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("patientId", patientId);
        metadata.put("medicalRecordId", medicalRecordId);
        if (prescriptionId != null) {
            metadata.put("prescriptionId", prescriptionId);
        }
        metadata.put("visitDate", visitDate);
        metadata.put("recordType", recordType);
        return metadata;
    }

    private String normalizeQuestion(String value) {
        String trimmed = trimNullable(value);
        if (trimmed == null || trimmed.length() < 3) {
            throw new BadRequestException("Question must contain at least 3 characters");
        }
        return trimmed;
    }

    private String patientName(Patient patient) {
        return patient.getUser() == null ? "Patient #" + patient.getId() : patient.getUser().getName();
    }

    private String doctorName(MedicalRecord record) {
        Doctor doctor = record.getDoctor();
        if (doctor == null || doctor.getUser() == null) {
            return doctor == null ? "Doctor" : "Doctor #" + doctor.getId();
        }
        return doctor.getUser().getName();
    }

    private String valueOrMissing(String value) {
        String trimmed = trimNullable(value);
        return trimmed == null ? "Not recorded" : trimmed;
    }

    private String trimNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }
}
