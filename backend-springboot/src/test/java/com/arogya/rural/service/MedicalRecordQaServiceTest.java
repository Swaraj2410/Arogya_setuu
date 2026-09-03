package com.arogya.rural.service;

import com.arogya.rural.dto.request.MedicalRecordQuestionRequest;
import com.arogya.rural.dto.response.MedicalRecordQaResponse;
import com.arogya.rural.entity.Doctor;
import com.arogya.rural.entity.MedicalRecord;
import com.arogya.rural.entity.Patient;
import com.arogya.rural.entity.Prescription;
import com.arogya.rural.entity.User;
import com.arogya.rural.enums.Role;
import com.arogya.rural.exception.ResourceNotFoundException;
import com.arogya.rural.repository.AppointmentRepository;
import com.arogya.rural.repository.DoctorRepository;
import com.arogya.rural.repository.MedicalRecordRepository;
import com.arogya.rural.repository.PatientRepository;
import com.arogya.rural.repository.PrescriptionRepository;
import com.arogya.rural.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MedicalRecordQaServiceTest {

    private FastApiMedicalRecordRagClient ragClient;
    private PatientRepository patientRepository;
    private DoctorRepository doctorRepository;
    private MedicalRecordRepository medicalRecordRepository;
    private PrescriptionRepository prescriptionRepository;
    private AppointmentRepository appointmentRepository;
    private MedicalRecordQaService service;

    @BeforeEach
    void setUp() {
        ragClient = mock(FastApiMedicalRecordRagClient.class);
        patientRepository = mock(PatientRepository.class);
        doctorRepository = mock(DoctorRepository.class);
        medicalRecordRepository = mock(MedicalRecordRepository.class);
        prescriptionRepository = mock(PrescriptionRepository.class);
        appointmentRepository = mock(AppointmentRepository.class);
        service = new MedicalRecordQaService(
                ragClient,
                patientRepository,
                doctorRepository,
                medicalRecordRepository,
                prescriptionRepository,
                appointmentRepository
        );
    }

    @Test
    void askBuildsRecordAwareDocumentsForAuthorizedDoctor() {
        Doctor doctor = doctor(7L, 88L);
        Patient patient = patient(12L);
        MedicalRecord record = record(21L, patient, doctor);
        Prescription prescription = prescription(14L, record, patient, doctor);
        MedicalRecordQaResponse expected = new MedicalRecordQaResponse();
        expected.setAnswer("Paracetamol was prescribed.");

        when(doctorRepository.findByUserIdWithDetails(88L)).thenReturn(Optional.of(doctor));
        when(patientRepository.findByIdWithUser(12L)).thenReturn(Optional.of(patient));
        when(medicalRecordRepository.existsByDoctorIdAndPatientId(7L, 12L)).thenReturn(true);
        when(medicalRecordRepository.search(12L, 7L, null, null)).thenReturn(List.of(record));
        when(prescriptionRepository.findByMedicalRecordId(21L)).thenReturn(List.of(prescription));
        when(ragClient.ask(eq(12L), eq("What medicines were prescribed recently?"), anyList())).thenReturn(expected);

        MedicalRecordQaResponse response = service.ask(doctorPrincipal(), 12L, request(" What medicines were prescribed recently? "));

        ArgumentCaptor<List<FastApiMedicalRecordRagClient.RagDocument>> documentsCaptor = ArgumentCaptor.captor();
        verify(ragClient).ask(eq(12L), eq("What medicines were prescribed recently?"), documentsCaptor.capture());
        assertThat(response).isSameAs(expected);
        assertThat(documentsCaptor.getValue()).hasSize(2);
        assertThat(documentsCaptor.getValue().get(0).text())
                .contains("Medical Visit", "Medical Record ID: 21", "Diagnosis: Viral fever", "Treatment: Rest and fluids");
        assertThat(documentsCaptor.getValue().get(1).text())
                .contains("Prescription", "Prescription ID: 14", "Medicines: Paracetamol 500mg", "Dosage Instructions: Twice daily for 5 days");
        assertThat(documentsCaptor.getValue().get(1).metadata())
                .containsEntry("patientId", 12L)
                .containsEntry("medicalRecordId", 21L)
                .containsEntry("prescriptionId", 14L)
                .containsEntry("recordType", "PRESCRIPTION");
    }

    @Test
    void askRequiresDoctorRole() {
        assertThatThrownBy(() -> service.ask(patientPrincipal(), 12L, request("Summarize history")))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Only doctors can ask questions about medical records");
    }

    @Test
    void askRejectsUnauthorizedDoctorPatientRelationship() {
        Doctor doctor = doctor(7L, 88L);
        Patient patient = patient(12L);
        when(doctorRepository.findByUserIdWithDetails(88L)).thenReturn(Optional.of(doctor));
        when(patientRepository.findByIdWithUser(12L)).thenReturn(Optional.of(patient));
        when(medicalRecordRepository.existsByDoctorIdAndPatientId(7L, 12L)).thenReturn(false);
        when(appointmentRepository.existsByDoctorIdAndPatientId(7L, 12L)).thenReturn(false);

        assertThatThrownBy(() -> service.ask(doctorPrincipal(), 12L, request("Summarize history")))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Doctor is not authorized to access this patient's medical records");
    }

    @Test
    void askHandlesAuthorizedPatientWithNoRecords() {
        Doctor doctor = doctor(7L, 88L);
        Patient patient = patient(12L);
        when(doctorRepository.findByUserIdWithDetails(88L)).thenReturn(Optional.of(doctor));
        when(patientRepository.findByIdWithUser(12L)).thenReturn(Optional.of(patient));
        when(medicalRecordRepository.existsByDoctorIdAndPatientId(7L, 12L)).thenReturn(false);
        when(appointmentRepository.existsByDoctorIdAndPatientId(7L, 12L)).thenReturn(true);
        when(medicalRecordRepository.search(12L, 7L, null, null)).thenReturn(List.of());

        assertThatThrownBy(() -> service.ask(doctorPrincipal(), 12L, request("Summarize history")))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("No medical records are available for this patient");
    }

    private MedicalRecordQuestionRequest request(String question) {
        MedicalRecordQuestionRequest request = new MedicalRecordQuestionRequest();
        request.setQuestion(question);
        return request;
    }

    private Doctor doctor(Long doctorId, Long userId) {
        User user = new User("Dr. Asha Iyer", "doctor@example.com", "password", Role.DOCTOR);
        user.setId(userId);
        Doctor doctor = new Doctor();
        doctor.setId(doctorId);
        doctor.setUser(user);
        return doctor;
    }

    private Patient patient(Long patientId) {
        User user = new User("Ananya Sharma", "patient@example.com", "password", Role.PATIENT);
        user.setId(44L);
        Patient patient = new Patient();
        patient.setId(patientId);
        patient.setUser(user);
        return patient;
    }

    private MedicalRecord record(Long recordId, Patient patient, Doctor doctor) {
        MedicalRecord record = new MedicalRecord();
        record.setId(recordId);
        record.setPatient(patient);
        record.setDoctor(doctor);
        record.setVisitDate(LocalDate.of(2026, 8, 12));
        record.setDiagnosis("Viral fever");
        record.setTreatment("Rest and fluids");
        record.setNotes("Review if fever persists");
        return record;
    }

    private Prescription prescription(Long prescriptionId, MedicalRecord record, Patient patient, Doctor doctor) {
        Prescription prescription = new Prescription();
        prescription.setId(prescriptionId);
        prescription.setMedicalRecord(record);
        prescription.setPatient(patient);
        prescription.setDoctor(doctor);
        prescription.setMedicines("Paracetamol 500mg");
        prescription.setDosageInstructions("Twice daily for 5 days");
        return prescription;
    }

    private UserPrincipal doctorPrincipal() {
        return principal(Role.DOCTOR, 88L, "doctor@example.com");
    }

    private UserPrincipal patientPrincipal() {
        return principal(Role.PATIENT, 44L, "patient@example.com");
    }

    private UserPrincipal principal(Role role, Long id, String email) {
        User user = new User("Test User", email, "password", role);
        user.setId(id);
        return new UserPrincipal(user);
    }
}
