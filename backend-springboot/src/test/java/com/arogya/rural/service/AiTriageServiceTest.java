package com.arogya.rural.service;

import com.arogya.rural.dto.request.AiTriageRequest;
import com.arogya.rural.dto.response.AiTriageAssessmentResponse;
import com.arogya.rural.dto.response.AiTriageResponse;
import com.arogya.rural.dto.response.DoctorResponse;
import com.arogya.rural.entity.Specialization;
import com.arogya.rural.entity.User;
import com.arogya.rural.enums.Role;
import com.arogya.rural.exception.AiServiceUnavailableException;
import com.arogya.rural.repository.SpecializationRepository;
import com.arogya.rural.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AiTriageServiceTest {

    private FastApiTriageClient fastApiTriageClient;
    private SpecializationRepository specializationRepository;
    private DoctorService doctorService;
    private AiTriageService aiTriageService;

    @BeforeEach
    void setUp() {
        fastApiTriageClient = mock(FastApiTriageClient.class);
        specializationRepository = mock(SpecializationRepository.class);
        doctorService = mock(DoctorService.class);
        aiTriageService = new AiTriageService(fastApiTriageClient, specializationRepository, doctorService);
    }

    @Test
    void triageSendsAllowedSpecializationsAndReturnsMatchingDoctors() {
        Specialization cardiology = specialization(1L, "Cardiology");
        Specialization dermatology = specialization(2L, "Dermatology");
        when(specializationRepository.findAllOrdered()).thenReturn(List.of(cardiology, dermatology));
        when(fastApiTriageClient.requestAssessment(eq("skin rash and severe itching"), anyList(), eq("en")))
                .thenReturn(assessment("Dermatology"));

        DoctorResponse doctor = new DoctorResponse();
        doctor.setId(22L);
        when(doctorService.listDoctors(2L)).thenReturn(List.of(doctor));

        AiTriageResponse response = aiTriageService.triage(patientPrincipal(), request("skin rash and severe itching"));

        ArgumentCaptor<List<String>> specializationsCaptor = ArgumentCaptor.captor();
        verify(fastApiTriageClient).requestAssessment(eq("skin rash and severe itching"), specializationsCaptor.capture(), eq("en"));
        assertThat(specializationsCaptor.getValue()).containsExactly("Cardiology", "Dermatology");
        assertThat(response.getAssessment().getRecommendedSpecialization()).isEqualTo("Dermatology");
        assertThat(response.getDoctors()).containsExactly(doctor);
        verify(doctorService).listDoctors(2L);
    }

    @Test
    void triageFallsBackWhenAiInventsSpecialization() {
        Specialization cardiology = specialization(1L, "Cardiology");
        Specialization generalMedicine = specialization(3L, "General Medicine");
        when(specializationRepository.findAllOrdered()).thenReturn(List.of(cardiology, generalMedicine));
        when(fastApiTriageClient.requestAssessment(eq("unclear body pain and fever"), anyList(), eq("en")))
                .thenReturn(assessment("Invented Specialty"));

        AiTriageResponse response = aiTriageService.triage(patientPrincipal(), request("unclear body pain and fever"));

        assertThat(response.getAssessment().getRecommendedSpecialization()).isEqualTo("General Medicine");
        assertThat(response.getAssessment().getReason()).contains("qualified clinician");
        verify(doctorService).listDoctors(3L);
    }

    @Test
    void triageForwardsRequestedLanguage() {
        Specialization generalMedicine = specialization(3L, "General Medicine");
        AiTriageRequest request = request("मुझे बुखार और सिरदर्द है");
        request.setLanguage("hi");
        when(specializationRepository.findAllOrdered()).thenReturn(List.of(generalMedicine));
        when(fastApiTriageClient.requestAssessment(eq("मुझे बुखार और सिरदर्द है"), anyList(), eq("hi")))
                .thenReturn(assessment("General Medicine"));

        AiTriageResponse response = aiTriageService.triage(patientPrincipal(), request);

        assertThat(response.getAssessment().getRecommendedSpecialization()).isEqualTo("General Medicine");
        verify(fastApiTriageClient).requestAssessment(eq("मुझे बुखार और सिरदर्द है"), anyList(), eq("hi"));
    }

    @Test
    void triageRequiresPatientRole() {
        assertThatThrownBy(() -> aiTriageService.triage(doctorPrincipal(), request("fever and cough")))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Only patients can use AI symptom triage");
    }

    @Test
    void triagePropagatesFriendlyFastApiFailure() {
        when(specializationRepository.findAllOrdered()).thenReturn(List.of(specialization(1L, "General Medicine")));
        when(fastApiTriageClient.requestAssessment(eq("fever and cough"), anyList(), eq("en")))
                .thenThrow(new AiServiceUnavailableException(
                        "AI symptom assistant is temporarily unavailable. Please try again later or book a doctor directly."
                ));

        assertThatThrownBy(() -> aiTriageService.triage(patientPrincipal(), request("fever and cough")))
                .isInstanceOf(AiServiceUnavailableException.class)
                .hasMessage("AI symptom assistant is temporarily unavailable. Please try again later or book a doctor directly.");
    }

    private AiTriageRequest request(String symptoms) {
        AiTriageRequest request = new AiTriageRequest();
        request.setSymptoms(symptoms);
        return request;
    }

    private AiTriageAssessmentResponse assessment(String specialization) {
        AiTriageAssessmentResponse assessment = new AiTriageAssessmentResponse();
        assessment.setUrgency("MEDIUM");
        assessment.setRecommendedSpecialization(specialization);
        assessment.setReason("Needs clinician review.");
        assessment.setRecommendation("Book a consultation.");
        assessment.setWarningSigns(List.of());
        return assessment;
    }

    private Specialization specialization(Long id, String name) {
        Specialization specialization = new Specialization(name);
        specialization.setId(id);
        return specialization;
    }

    private UserPrincipal patientPrincipal() {
        return principal(Role.PATIENT, "patient@example.com");
    }

    private UserPrincipal doctorPrincipal() {
        return principal(Role.DOCTOR, "doctor@example.com");
    }

    private UserPrincipal principal(Role role, String email) {
        User user = new User("Test User", email, "password", role);
        user.setId(1L);
        return new UserPrincipal(user);
    }
}
