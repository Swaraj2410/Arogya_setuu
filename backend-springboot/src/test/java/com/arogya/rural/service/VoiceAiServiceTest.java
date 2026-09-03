package com.arogya.rural.service;

import com.arogya.rural.dto.response.VoiceTranscriptionResponse;
import com.arogya.rural.entity.User;
import com.arogya.rural.enums.Role;
import com.arogya.rural.exception.AiServiceUnavailableException;
import com.arogya.rural.exception.BadRequestException;
import com.arogya.rural.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class VoiceAiServiceTest {

    private FastApiVoiceClient voiceClient;
    private VoiceAiService service;

    @BeforeEach
    void setUp() {
        voiceClient = mock(FastApiVoiceClient.class);
        service = new VoiceAiService(voiceClient);
    }

    @Test
    void transcribeRequiresPatientRole() {
        assertThatThrownBy(() -> service.transcribe(doctorPrincipal(), audioFile(), "en"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Only patients can use voice symptom triage");
    }

    @Test
    void transcribeValidatesAudioType() {
        MockMultipartFile file = new MockMultipartFile("file", "voice.txt", "text/plain", "test".getBytes());

        assertThatThrownBy(() -> service.transcribe(patientPrincipal(), file, "en"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Unsupported audio type. Upload WEBM, WAV, MP3, M4A, or OGG audio");
    }

    @Test
    void transcribeValidatesRequestedLanguage() {
        assertThatThrownBy(() -> service.transcribe(patientPrincipal(), audioFile(), "fr"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Language must be en, hi, or mr");
    }

    @Test
    void transcribeSanitizesResponse() {
        MockMultipartFile file = audioFile();
        VoiceTranscriptionResponse draft = new VoiceTranscriptionResponse();
        draft.setText(" मुझे   बुखार है ");
        draft.setLanguage("hi");
        when(voiceClient.transcribe(file, "hi")).thenReturn(draft);

        VoiceTranscriptionResponse response = service.transcribe(patientPrincipal(), file, "hi");

        verify(voiceClient).transcribe(file, "hi");
        assertThat(response.getText()).isEqualTo("मुझे बुखार है");
        assertThat(response.getLanguage()).isEqualTo("hi");
    }

    @Test
    void transcribeRejectsInvalidFastApiLanguage() {
        MockMultipartFile file = audioFile();
        VoiceTranscriptionResponse draft = new VoiceTranscriptionResponse();
        draft.setText("I have fever");
        draft.setLanguage("fr");
        when(voiceClient.transcribe(file, null)).thenReturn(draft);

        assertThatThrownBy(() -> service.transcribe(patientPrincipal(), file, null))
                .isInstanceOf(AiServiceUnavailableException.class)
                .hasMessage("Voice transcription returned an invalid response.");
    }

    private MockMultipartFile audioFile() {
        return new MockMultipartFile("file", "voice.webm", "audio/webm", new byte[]{1, 2, 3});
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
