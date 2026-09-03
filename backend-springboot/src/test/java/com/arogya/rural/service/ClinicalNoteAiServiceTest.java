package com.arogya.rural.service;

import com.arogya.rural.dto.request.ClinicalNoteDraftRequest;
import com.arogya.rural.dto.response.ClinicalNoteDraftResponse;
import com.arogya.rural.entity.User;
import com.arogya.rural.enums.Role;
import com.arogya.rural.exception.AiServiceUnavailableException;
import com.arogya.rural.exception.BadRequestException;
import com.arogya.rural.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ClinicalNoteAiServiceTest {

    private FastApiClinicalNoteClient clinicalNoteClient;
    private ClinicalNoteAiService service;

    @BeforeEach
    void setUp() {
        clinicalNoteClient = mock(FastApiClinicalNoteClient.class);
        service = new ClinicalNoteAiService(clinicalNoteClient);
    }

    @Test
    void generateRequiresDoctorRole() {
        assertThatThrownBy(() -> service.generate(patientPrincipal(), request("patient fever and cough")))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Only doctors can generate clinical note drafts");
    }

    @Test
    void generateNormalizesNotesAndSanitizesDraft() {
        ClinicalNoteDraftResponse draft = new ClinicalNoteDraftResponse();
        draft.setDiagnosis(" Viral fever ");
        draft.setTreatment(null);
        draft.setMedicines(" Paracetamol 500 mg ");
        draft.setDosageInstructions(" Twice   daily after food ");
        draft.setNotes(" Patient reported fever and cough. ");
        when(clinicalNoteClient.generate(eq("patient fever and cough\nparacetamol 500 mg")))
                .thenReturn(draft);

        ClinicalNoteDraftResponse response = service.generate(
                doctorPrincipal(),
                request(" patient   fever and cough \n\n paracetamol 500 mg ")
        );

        verify(clinicalNoteClient).generate("patient fever and cough\nparacetamol 500 mg");
        assertThat(response.getDiagnosis()).isEqualTo("Viral fever");
        assertThat(response.getTreatment()).isEmpty();
        assertThat(response.getMedicines()).isEqualTo("Paracetamol 500 mg");
        assertThat(response.getDosageInstructions()).isEqualTo("Twice daily after food");
        assertThat(response.getNotes()).isEqualTo("Patient reported fever and cough.");
    }

    @Test
    void generateRejectsBlankOrTooShortNotes() {
        assertThatThrownBy(() -> service.generate(doctorPrincipal(), request(" a ")))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Rough notes must contain at least 3 characters");
    }

    @Test
    void generateRejectsOversizedAiDraftFields() {
        ClinicalNoteDraftResponse draft = new ClinicalNoteDraftResponse();
        draft.setNotes("x".repeat(1201));
        when(clinicalNoteClient.generate(eq("patient feeling better"))).thenReturn(draft);

        assertThatThrownBy(() -> service.generate(doctorPrincipal(), request("patient feeling better")))
                .isInstanceOf(AiServiceUnavailableException.class)
                .hasMessage("AI clinical note assistant returned an invalid draft.");
    }

    private ClinicalNoteDraftRequest request(String roughNotes) {
        ClinicalNoteDraftRequest request = new ClinicalNoteDraftRequest();
        request.setRoughNotes(roughNotes);
        return request;
    }

    private UserPrincipal doctorPrincipal() {
        return principal(Role.DOCTOR, "doctor@example.com");
    }

    private UserPrincipal patientPrincipal() {
        return principal(Role.PATIENT, "patient@example.com");
    }

    private UserPrincipal principal(Role role, String email) {
        User user = new User("Test User", email, "password", role);
        user.setId(1L);
        return new UserPrincipal(user);
    }
}
