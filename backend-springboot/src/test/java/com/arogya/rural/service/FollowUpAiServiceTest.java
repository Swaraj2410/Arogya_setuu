package com.arogya.rural.service;

import com.arogya.rural.dto.request.FollowUpAnalyzeRequest;
import com.arogya.rural.dto.request.FollowUpReminderRequest;
import com.arogya.rural.dto.response.FollowUpAnalysisResponse;
import com.arogya.rural.dto.response.NotificationResponse;
import com.arogya.rural.entity.Doctor;
import com.arogya.rural.entity.Patient;
import com.arogya.rural.entity.User;
import com.arogya.rural.enums.Role;
import com.arogya.rural.exception.ResourceNotFoundException;
import com.arogya.rural.repository.AppointmentRepository;
import com.arogya.rural.repository.DoctorRepository;
import com.arogya.rural.repository.MedicalRecordRepository;
import com.arogya.rural.repository.PatientRepository;
import com.arogya.rural.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class FollowUpAiServiceTest {

    private FastApiFollowUpClient followUpClient;
    private PatientRepository patientRepository;
    private DoctorRepository doctorRepository;
    private MedicalRecordRepository medicalRecordRepository;
    private AppointmentRepository appointmentRepository;
    private NotificationService notificationService;
    private FollowUpAiService service;

    @BeforeEach
    void setUp() {
        followUpClient = mock(FastApiFollowUpClient.class);
        patientRepository = mock(PatientRepository.class);
        doctorRepository = mock(DoctorRepository.class);
        medicalRecordRepository = mock(MedicalRecordRepository.class);
        appointmentRepository = mock(AppointmentRepository.class);
        notificationService = mock(NotificationService.class);
        service = new FollowUpAiService(
                followUpClient,
                patientRepository,
                doctorRepository,
                medicalRecordRepository,
                appointmentRepository,
                notificationService
        );
    }

    @Test
    void analyzeRequiresDoctorRole() {
        assertThatThrownBy(() -> service.analyze(patientPrincipal(), analyzeRequest("Follow up after 7 days")))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Only doctors can manage follow-up reminders");
    }

    @Test
    void analyzeCalculatesSuggestedDateFromAfterDays() {
        Doctor doctor = doctor(7L, 88L);
        Patient patient = patient(12L);
        FollowUpAnalysisResponse aiResponse = followUpResponse(true, 7);
        aiResponse.setReason("Review recovery");
        aiResponse.setReminderMessage("Your doctor recommended a follow-up consultation after 7 days.");
        when(doctorRepository.findByUserIdWithDetails(88L)).thenReturn(Optional.of(doctor));
        when(patientRepository.findByIdWithUser(12L)).thenReturn(Optional.of(patient));
        when(appointmentRepository.existsByDoctorIdAndPatientId(7L, 12L)).thenReturn(true);
        when(followUpClient.analyze("Follow up after 7 days")).thenReturn(aiResponse);

        FollowUpAnalysisResponse response = service.analyze(doctorPrincipal(), analyzeRequest(" Follow   up after 7 days "));

        verify(followUpClient).analyze("Follow up after 7 days");
        assertThat(response.isFollowUpRequired()).isTrue();
        assertThat(response.getAfterDays()).isEqualTo(7);
        assertThat(response.getSuggestedDate()).isEqualTo("2026-09-09");
        assertThat(response.getReason()).isEqualTo("Review recovery");
    }

    @Test
    void analyzeFlagsAmbiguousTimingForReview() {
        Doctor doctor = doctor(7L, 88L);
        Patient patient = patient(12L);
        FollowUpAnalysisResponse aiResponse = followUpResponse(true, null);
        aiResponse.setRequiresReview(true);
        aiResponse.setReviewReason("Follow-up timing is ambiguous.");
        when(doctorRepository.findByUserIdWithDetails(88L)).thenReturn(Optional.of(doctor));
        when(patientRepository.findByIdWithUser(12L)).thenReturn(Optional.of(patient));
        when(appointmentRepository.existsByDoctorIdAndPatientId(7L, 12L)).thenReturn(true);
        when(followUpClient.analyze("Follow up later")).thenReturn(aiResponse);

        FollowUpAnalysisResponse response = service.analyze(doctorPrincipal(), analyzeRequest("Follow up later"));

        assertThat(response.isFollowUpRequired()).isTrue();
        assertThat(response.getSuggestedDate()).isNull();
        assertThat(response.isRequiresReview()).isTrue();
        assertThat(response.getReviewReason()).isEqualTo("Follow-up timing is ambiguous.");
    }

    @Test
    void analyzeClearsDatesWhenNoFollowUpRequired() {
        Doctor doctor = doctor(7L, 88L);
        Patient patient = patient(12L);
        FollowUpAnalysisResponse aiResponse = followUpResponse(false, 7);
        aiResponse.setRequiresReview(true);
        aiResponse.setReviewReason("Should be cleared.");
        when(doctorRepository.findByUserIdWithDetails(88L)).thenReturn(Optional.of(doctor));
        when(patientRepository.findByIdWithUser(12L)).thenReturn(Optional.of(patient));
        when(appointmentRepository.existsByDoctorIdAndPatientId(7L, 12L)).thenReturn(true);
        when(followUpClient.analyze("Patient stable")).thenReturn(aiResponse);

        FollowUpAnalysisResponse response = service.analyze(doctorPrincipal(), analyzeRequest("Patient stable"));

        assertThat(response.isFollowUpRequired()).isFalse();
        assertThat(response.getAfterDays()).isNull();
        assertThat(response.getSuggestedDate()).isNull();
        assertThat(response.isRequiresReview()).isFalse();
        assertThat(response.getReviewReason()).isEmpty();
    }

    @Test
    void createReminderCreatesPatientNotification() {
        Doctor doctor = doctor(7L, 88L);
        Patient patient = patient(12L);
        NotificationResponse expected = new NotificationResponse();
        expected.setTitle("Follow-up reminder");
        when(doctorRepository.findByUserIdWithDetails(88L)).thenReturn(Optional.of(doctor));
        when(patientRepository.findByIdWithUser(12L)).thenReturn(Optional.of(patient));
        when(medicalRecordRepository.existsByDoctorIdAndPatientId(7L, 12L)).thenReturn(true);
        when(notificationService.createForUser(
                eq(patient.getUser()),
                eq("Follow-up reminder"),
                eq("Follow-up date: " + LocalDate.now().plusDays(7) + ". Your doctor recommended follow-up. Reason: Review recovery"),
                eq("follow-up")
        )).thenReturn(expected);

        NotificationResponse response = service.createReminder(doctorPrincipal(), reminderRequest());

        assertThat(response).isSameAs(expected);
        verify(notificationService).createForUser(
                eq(patient.getUser()),
                eq("Follow-up reminder"),
                eq("Follow-up date: " + LocalDate.now().plusDays(7) + ". Your doctor recommended follow-up. Reason: Review recovery"),
                eq("follow-up")
        );
    }

    @Test
    void createReminderRejectsUnauthorizedDoctorPatientRelationship() {
        Doctor doctor = doctor(7L, 88L);
        Patient patient = patient(12L);
        when(doctorRepository.findByUserIdWithDetails(88L)).thenReturn(Optional.of(doctor));
        when(patientRepository.findByIdWithUser(12L)).thenReturn(Optional.of(patient));

        assertThatThrownBy(() -> service.createReminder(doctorPrincipal(), reminderRequest()))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Doctor is not authorized to manage follow-ups for this patient");
    }

    @Test
    void analyzeHandlesMissingPatient() {
        Doctor doctor = doctor(7L, 88L);
        when(doctorRepository.findByUserIdWithDetails(88L)).thenReturn(Optional.of(doctor));
        when(patientRepository.findByIdWithUser(12L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.analyze(doctorPrincipal(), analyzeRequest("Follow up after 7 days")))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Patient not found");
    }

    private FollowUpAnalyzeRequest analyzeRequest(String notes) {
        FollowUpAnalyzeRequest request = new FollowUpAnalyzeRequest();
        request.setPatientId(12L);
        request.setVisitDate(LocalDate.of(2026, 9, 2));
        request.setConsultationNotes(notes);
        return request;
    }

    private FollowUpReminderRequest reminderRequest() {
        FollowUpReminderRequest request = new FollowUpReminderRequest();
        request.setPatientId(12L);
        request.setFollowUpDate(LocalDate.now().plusDays(7));
        request.setReason("Review recovery");
        request.setReminderMessage("Your doctor recommended follow-up.");
        return request;
    }

    private FollowUpAnalysisResponse followUpResponse(boolean required, Integer afterDays) {
        FollowUpAnalysisResponse response = new FollowUpAnalysisResponse();
        response.setFollowUpRequired(required);
        response.setAfterDays(afterDays);
        response.setReason("");
        response.setReminderMessage("");
        response.setFollowUpDateText("");
        response.setReviewReason("");
        return response;
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
