package com.arogya.rural.service;

import com.arogya.rural.dto.response.PrescriptionOcrMedicineResponse;
import com.arogya.rural.dto.response.PrescriptionOcrResponse;
import com.arogya.rural.entity.User;
import com.arogya.rural.enums.Role;
import com.arogya.rural.exception.AiServiceUnavailableException;
import com.arogya.rural.exception.BadRequestException;
import com.arogya.rural.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PrescriptionOcrAiServiceTest {

    private FastApiPrescriptionOcrClient prescriptionOcrClient;
    private PrescriptionOcrAiService service;

    @BeforeEach
    void setUp() {
        prescriptionOcrClient = mock(FastApiPrescriptionOcrClient.class);
        service = new PrescriptionOcrAiService(prescriptionOcrClient);
    }

    @Test
    void extractRequiresDoctorRole() {
        assertThatThrownBy(() -> service.extract(patientPrincipal(), imageFile()))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Only doctors can digitize prescriptions");
    }

    @Test
    void extractValidatesImageType() {
        MockMultipartFile file = new MockMultipartFile("file", "notes.txt", "text/plain", "test".getBytes());

        assertThatThrownBy(() -> service.extract(doctorPrincipal(), file))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Unsupported image type. Upload a PNG or JPG prescription image");
    }

    @Test
    void extractSanitizesDraft() {
        MockMultipartFile file = imageFile();
        PrescriptionOcrResponse draft = new PrescriptionOcrResponse();
        draft.setRawText(" Paracetamol 500 mg ");
        draft.setAdditionalInstructions(" After food ");
        draft.setQualityWarning(" Verify handwriting ");
        draft.setVerificationRequired(true);
        PrescriptionOcrMedicineResponse medicine = new PrescriptionOcrMedicineResponse();
        medicine.setName(" Paracetamol ");
        medicine.setDosage(" 500 mg ");
        medicine.setFrequency(" Twice daily ");
        medicine.setDuration(" 5 days ");
        medicine.setInstructions(" After food ");
        draft.setMedicines(List.of(medicine));
        when(prescriptionOcrClient.extract(file)).thenReturn(draft);

        PrescriptionOcrResponse response = service.extract(doctorPrincipal(), file);

        verify(prescriptionOcrClient).extract(file);
        assertThat(response.getRawText()).isEqualTo("Paracetamol 500 mg");
        assertThat(response.getAdditionalInstructions()).isEqualTo("After food");
        assertThat(response.getQualityWarning()).isEqualTo("Verify handwriting");
        assertThat(response.getMedicines()).hasSize(1);
        assertThat(response.getMedicines().get(0).getName()).isEqualTo("Paracetamol");
        assertThat(response.getMedicines().get(0).getDosage()).isEqualTo("500 mg");
    }

    @Test
    void extractRejectsOversizedAiDraft() {
        MockMultipartFile file = imageFile();
        PrescriptionOcrResponse draft = new PrescriptionOcrResponse();
        draft.setRawText("x".repeat(12001));
        when(prescriptionOcrClient.extract(file)).thenReturn(draft);

        assertThatThrownBy(() -> service.extract(doctorPrincipal(), file))
                .isInstanceOf(AiServiceUnavailableException.class)
                .hasMessage("AI prescription digitizer returned an invalid draft.");
    }

    private MockMultipartFile imageFile() {
        return new MockMultipartFile("file", "prescription.png", "image/png", new byte[]{1, 2, 3});
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
