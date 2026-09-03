package com.arogya.rural.service;

import com.arogya.rural.dto.response.VoiceTranscriptionResponse;
import com.arogya.rural.enums.Role;
import com.arogya.rural.exception.AiServiceUnavailableException;
import com.arogya.rural.exception.BadRequestException;
import com.arogya.rural.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class VoiceAiService {

    private static final long MAX_AUDIO_BYTES = 15L * 1024L * 1024L;
    private static final Set<String> SUPPORTED_TYPES = Set.of(
            "audio/webm",
            "video/webm",
            "audio/wav",
            "audio/x-wav",
            "audio/mpeg",
            "audio/mp3",
            "audio/mp4",
            "audio/m4a",
            "audio/ogg"
    );

    private final FastApiVoiceClient voiceClient;

    public VoiceTranscriptionResponse transcribe(UserPrincipal currentUser, MultipartFile file, String language) {
        ensurePatient(currentUser);
        String normalizedLanguage = normalizeRequestedLanguage(language);
        validateFile(file);
        return sanitize(voiceClient.transcribe(file, normalizedLanguage));
    }

    private void ensurePatient(UserPrincipal currentUser) {
        if (currentUser == null || currentUser.getRole() != Role.PATIENT) {
            throw new AccessDeniedException("Only patients can use voice symptom triage");
        }
    }

    private String normalizeRequestedLanguage(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().toLowerCase();
        return switch (normalized) {
            case "en", "hi", "mr" -> normalized;
            default -> throw new BadRequestException("Language must be en, hi, or mr");
        };
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Voice recording is required");
        }
        if (file.getSize() > MAX_AUDIO_BYTES) {
            throw new BadRequestException("Voice recording must be 15 MB or smaller");
        }
        String contentType = normalizeContentType(file.getContentType());
        if (!SUPPORTED_TYPES.contains(contentType)) {
            throw new BadRequestException("Unsupported audio type. Upload WEBM, WAV, MP3, M4A, or OGG audio");
        }
    }

    private VoiceTranscriptionResponse sanitize(VoiceTranscriptionResponse response) {
        if (response == null) {
            throw new AiServiceUnavailableException("Voice transcription returned an invalid response.");
        }
        String text = cleanField(response.getText(), 4000);
        if (text.isBlank()) {
            throw new AiServiceUnavailableException("Voice transcription returned an empty response.");
        }
        String language = normalizeResponseLanguage(response.getLanguage());
        if (language == null) {
            language = "en";
        }

        VoiceTranscriptionResponse sanitized = new VoiceTranscriptionResponse();
        sanitized.setText(text);
        sanitized.setLanguage(language);
        return sanitized;
    }

    private String normalizeContentType(String contentType) {
        if (contentType == null) {
            return "";
        }
        return contentType.split(";")[0].trim().toLowerCase();
    }

    private String normalizeResponseLanguage(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().toLowerCase();
        return switch (normalized) {
            case "en", "hi", "mr" -> normalized;
            default -> throw new AiServiceUnavailableException("Voice transcription returned an invalid response.");
        };
    }

    private String cleanField(String value, int maxLength) {
        String cleaned = value == null ? "" : value.trim().replaceAll("\\s+", " ");
        if (cleaned.length() > maxLength) {
            throw new AiServiceUnavailableException("Voice transcription returned an invalid response.");
        }
        return cleaned;
    }
}
