package com.arogya.rural.service;

import com.arogya.rural.dto.request.ClinicalNoteDraftRequest;
import com.arogya.rural.dto.response.ClinicalNoteDraftResponse;
import com.arogya.rural.enums.Role;
import com.arogya.rural.exception.AiServiceUnavailableException;
import com.arogya.rural.exception.BadRequestException;
import com.arogya.rural.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ClinicalNoteAiService {

    private static final int ROUGH_NOTES_MIN_LENGTH = 3;
    private static final int ROUGH_NOTES_MAX_LENGTH = 4000;

    private final FastApiClinicalNoteClient clinicalNoteClient;

    public ClinicalNoteDraftResponse generate(UserPrincipal currentUser, ClinicalNoteDraftRequest request) {
        ensureDoctor(currentUser);
        if (request == null) {
            throw new BadRequestException("Rough notes are required");
        }
        String roughNotes = normalizeRoughNotes(request.getRoughNotes());
        return sanitize(clinicalNoteClient.generate(roughNotes));
    }

    private void ensureDoctor(UserPrincipal currentUser) {
        if (currentUser == null || currentUser.getRole() != Role.DOCTOR) {
            throw new AccessDeniedException("Only doctors can generate clinical note drafts");
        }
    }

    private String normalizeRoughNotes(String value) {
        String cleaned = trimAndCollapseLines(value);
        if (cleaned == null || cleaned.length() < ROUGH_NOTES_MIN_LENGTH) {
            throw new BadRequestException("Rough notes must contain at least 3 characters");
        }
        if (cleaned.length() > ROUGH_NOTES_MAX_LENGTH) {
            throw new BadRequestException("Rough notes must be 4000 characters or fewer");
        }
        return cleaned;
    }

    private ClinicalNoteDraftResponse sanitize(ClinicalNoteDraftResponse response) {
        if (response == null) {
            throw new AiServiceUnavailableException("AI clinical note assistant returned an invalid draft.");
        }

        ClinicalNoteDraftResponse sanitized = new ClinicalNoteDraftResponse();
        sanitized.setDiagnosis(cleanField(response.getDiagnosis(), 500));
        sanitized.setTreatment(cleanField(response.getTreatment(), 800));
        sanitized.setMedicines(cleanField(response.getMedicines(), 800));
        sanitized.setDosageInstructions(cleanField(response.getDosageInstructions(), 800));
        sanitized.setNotes(cleanField(response.getNotes(), 1200));
        return sanitized;
    }

    private String cleanField(String value, int maxLength) {
        String cleaned = value == null ? "" : value.trim().replaceAll("\\s+", " ");
        if (cleaned.length() > maxLength) {
            throw new AiServiceUnavailableException("AI clinical note assistant returned an invalid draft.");
        }
        return cleaned;
    }

    private String trimAndCollapseLines(String value) {
        if (value == null) {
            return null;
        }
        String[] lines = value.trim().split("\\R");
        StringBuilder builder = new StringBuilder();
        for (String line : lines) {
            String cleanedLine = line.trim().replaceAll("\\s+", " ");
            if (cleanedLine.isBlank()) {
                continue;
            }
            if (builder.length() > 0) {
                builder.append('\n');
            }
            builder.append(cleanedLine);
        }
        return builder.length() == 0 ? null : builder.toString();
    }
}
