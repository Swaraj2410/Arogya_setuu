package com.arogya.rural.service;

import com.arogya.rural.dto.request.AiTriageRequest;
import com.arogya.rural.dto.response.AiTriageAssessmentResponse;
import com.arogya.rural.dto.response.AiTriageResponse;
import com.arogya.rural.dto.response.DoctorResponse;
import com.arogya.rural.entity.Specialization;
import com.arogya.rural.enums.Role;
import com.arogya.rural.exception.AiServiceUnavailableException;
import com.arogya.rural.exception.BadRequestException;
import com.arogya.rural.repository.SpecializationRepository;
import com.arogya.rural.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AiTriageService {

    private final FastApiTriageClient fastApiTriageClient;
    private final SpecializationRepository specializationRepository;
    private final DoctorService doctorService;

    public AiTriageResponse triage(UserPrincipal currentUser, AiTriageRequest request) {
        if (currentUser == null || currentUser.getRole() != Role.PATIENT) {
            throw new AccessDeniedException("Only patients can use AI symptom triage");
        }

        String symptoms = trimSymptoms(request.getSymptoms());
        String language = normalizeLanguage(request.getLanguage());
        List<Specialization> specializations = specializationRepository.findAllOrdered();
        if (specializations.isEmpty()) {
            throw new BadRequestException("No doctor specializations are available");
        }

        List<String> allowedNames = specializations.stream()
                .map(Specialization::getName)
                .map(this::trimNullable)
                .filter(name -> name != null)
                .distinct()
                .toList();
        if (allowedNames.isEmpty()) {
            throw new BadRequestException("No doctor specializations are available");
        }

        AiTriageAssessmentResponse assessment;
        try {
            assessment = fastApiTriageClient.requestAssessment(symptoms, allowedNames, language);
        } catch (AiServiceUnavailableException exception) {
            Specialization fallback = fallbackSpecialization(specializations);
            assessment = safeFallbackAssessment(fallback.getName(), language);
            List<DoctorResponse> doctors = doctorService.listDoctors(fallback.getId());
            return new AiTriageResponse(assessment, doctors);
        }

        Specialization selectedSpecialization = findRecommendedSpecialization(assessment, specializations);
        if (selectedSpecialization == null) {
            selectedSpecialization = fallbackSpecialization(specializations);
            assessment = safeFallbackAssessment(selectedSpecialization.getName(), language);
        } else {
            normalizeAssessment(assessment, selectedSpecialization, language);
        }

        List<DoctorResponse> doctors = doctorService.listDoctors(selectedSpecialization.getId());
        return new AiTriageResponse(assessment, doctors);
    }

    private Specialization findRecommendedSpecialization(
            AiTriageAssessmentResponse assessment,
            List<Specialization> specializations
    ) {
        String recommended = trimNullable(assessment.getRecommendedSpecialization());
        if (recommended != null) {
            for (Specialization specialization : specializations) {
                String name = trimNullable(specialization.getName());
                if (name != null && name.equalsIgnoreCase(recommended)) {
                    return specialization;
                }
            }
        }

        return null;
    }

    private Specialization fallbackSpecialization(List<Specialization> specializations) {
        return specializations.stream()
                .filter(specialization -> {
                    String name = trimNullable(specialization.getName());
                    return name != null && name.equalsIgnoreCase("General Medicine");
                })
                .findFirst()
                .orElse(specializations.get(0));
    }

    private AiTriageAssessmentResponse safeFallbackAssessment(String specializationName, String language) {
        AiTriageAssessmentResponse assessment = new AiTriageAssessmentResponse();
        assessment.setUrgency("MEDIUM");
        assessment.setRecommendedSpecialization(specializationName);
        assessment.setReason(localizedFallbackReason(language));
        assessment.setRecommendation(localizedFallbackRecommendation(specializationName, language));
        assessment.setWarningSigns(localizedWarningSigns(language));
        return assessment;
    }

    private void normalizeAssessment(AiTriageAssessmentResponse assessment, Specialization selectedSpecialization, String language) {
        assessment.setUrgency(normalizeUrgency(assessment.getUrgency()));
        assessment.setRecommendedSpecialization(selectedSpecialization.getName());
        assessment.setReason(defaultIfBlank(
                assessment.getReason(),
                localizedFallbackReason(language)
        ));
        assessment.setRecommendation(defaultIfBlank(
                assessment.getRecommendation(),
                localizedFallbackRecommendation(selectedSpecialization.getName(), language)
        ));
        if (assessment.getWarningSigns() == null) {
            assessment.setWarningSigns(List.of());
        }
    }

    private String normalizeUrgency(String urgency) {
        if (urgency == null) {
            return "MEDIUM";
        }

        String normalized = urgency.trim().toUpperCase();
        return switch (normalized) {
            case "LOW", "MEDIUM", "HIGH", "EMERGENCY" -> normalized;
            default -> "MEDIUM";
        };
    }

    private String normalizeLanguage(String value) {
        String language = trimNullable(value);
        if (language == null) {
            return "en";
        }
        String normalized = language.toLowerCase();
        return switch (normalized) {
            case "en", "hi", "mr" -> normalized;
            default -> throw new BadRequestException("Language must be en, hi, or mr");
        };
    }

    private String trimSymptoms(String value) {
        String trimmed = trimNullable(value);
        if (trimmed == null || trimmed.length() < 5) {
            throw new BadRequestException("Symptoms must contain at least 5 characters");
        }
        return trimmed;
    }

    private String defaultIfBlank(String value, String fallback) {
        String trimmed = trimNullable(value);
        return trimmed == null ? fallback : trimmed;
    }

    private String localizedFallbackReason(String language) {
        return switch (language) {
            case "hi" -> "इन लक्षणों की किसी योग्य डॉक्टर से जांच होनी चाहिए।";
            case "mr" -> "या लक्षणांची पात्र डॉक्टरांकडून तपासणी होणे आवश्यक आहे.";
            default -> "The symptoms should be reviewed by a qualified clinician.";
        };
    }

    private String localizedFallbackRecommendation(String specializationName, String language) {
        return switch (language) {
            case "hi" -> specializationName + " के डॉक्टर से परामर्श बुक करें या लक्षण बिगड़ने पर तुरंत देखभाल लें।";
            case "mr" -> specializationName + " डॉक्टरांचा सल्ला घ्या किंवा लक्षणे वाढल्यास तातडीची मदत घ्या.";
            default -> "Book a consultation with " + specializationName + " or seek urgent care if symptoms worsen.";
        };
    }

    private List<String> localizedWarningSigns(String language) {
        return switch (language) {
            case "hi" -> List.of("सीने में तेज दर्द", "सांस लेने में कठिनाई", "बेहोशी", "भारी रक्तस्राव");
            case "mr" -> List.of("छातीत तीव्र वेदना", "श्वास घेण्यास त्रास", "बेशुद्ध होणे", "जास्त रक्तस्राव");
            default -> List.of("Severe chest pain", "Difficulty breathing", "Loss of consciousness", "Heavy bleeding");
        };
    }

    private String trimNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }
}
