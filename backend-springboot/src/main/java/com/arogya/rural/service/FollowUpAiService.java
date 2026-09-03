package com.arogya.rural.service;

import com.arogya.rural.dto.request.FollowUpAnalyzeRequest;
import com.arogya.rural.dto.request.FollowUpReminderRequest;
import com.arogya.rural.dto.response.FollowUpAnalysisResponse;
import com.arogya.rural.dto.response.NotificationResponse;
import com.arogya.rural.entity.Doctor;
import com.arogya.rural.entity.Patient;
import com.arogya.rural.enums.Role;
import com.arogya.rural.exception.AiServiceUnavailableException;
import com.arogya.rural.exception.BadRequestException;
import com.arogya.rural.exception.ResourceNotFoundException;
import com.arogya.rural.repository.AppointmentRepository;
import com.arogya.rural.repository.DoctorRepository;
import com.arogya.rural.repository.MedicalRecordRepository;
import com.arogya.rural.repository.PatientRepository;
import com.arogya.rural.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Month;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class FollowUpAiService {

    private static final int NOTES_MIN_LENGTH = 3;
    private static final int NOTES_MAX_LENGTH = 4000;
    private static final DateTimeFormatter DAY_MONTH_YEAR = DateTimeFormatter.ofPattern("d MMMM uuuu", Locale.ENGLISH);
    private static final DateTimeFormatter DAY_SHORT_MONTH_YEAR = DateTimeFormatter.ofPattern("d MMM uuuu", Locale.ENGLISH);
    private static final Pattern DAY_MONTH_PATTERN = Pattern.compile(
            "\\b(\\d{1,2})\\s+(january|february|march|april|may|june|july|august|september|october|november|december|" +
                    "jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\\b",
            Pattern.CASE_INSENSITIVE
    );

    private final FastApiFollowUpClient followUpClient;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final AppointmentRepository appointmentRepository;
    private final NotificationService notificationService;

    public FollowUpAnalysisResponse analyze(UserPrincipal currentUser, FollowUpAnalyzeRequest request) {
        Doctor doctor = resolveDoctor(currentUser);
        if (request == null) {
            throw new BadRequestException("Consultation notes are required");
        }
        Patient patient = patientRepository.findByIdWithUser(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        ensureDoctorCanAccessPatient(doctor.getId(), patient.getId());

        LocalDate visitDate = request.getVisitDate();
        if (visitDate == null) {
            throw new BadRequestException("Visit date is required");
        }
        String notes = normalizeNotes(request.getConsultationNotes());
        FollowUpAnalysisResponse response = sanitize(followUpClient.analyze(notes));
        applySuggestedDate(response, visitDate);
        return response;
    }

    public NotificationResponse createReminder(UserPrincipal currentUser, FollowUpReminderRequest request) {
        Doctor doctor = resolveDoctor(currentUser);
        if (request == null) {
            throw new BadRequestException("Follow-up reminder details are required");
        }
        Patient patient = patientRepository.findByIdWithUser(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        ensureDoctorCanAccessPatient(doctor.getId(), patient.getId());

        if (request.getFollowUpDate() == null) {
            throw new BadRequestException("Follow-up date is required");
        }
        if (request.getFollowUpDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Follow-up date cannot be in the past");
        }
        String reminderMessage = cleanRequiredField(request.getReminderMessage(), 500, "Reminder message is required");
        String reason = cleanOptionalField(request.getReason(), 500);
        String message = "Follow-up date: " + request.getFollowUpDate() + ". " + reminderMessage;
        if (!reason.isBlank()) {
            message = message + " Reason: " + reason;
        }

        return notificationService.createForUser(patient.getUser(), "Follow-up reminder", message, "follow-up");
    }

    private Doctor resolveDoctor(UserPrincipal currentUser) {
        if (currentUser == null || currentUser.getRole() != Role.DOCTOR) {
            throw new AccessDeniedException("Only doctors can manage follow-up reminders");
        }

        return doctorRepository.findByUserIdWithDetails(currentUser.getId())
                .orElseThrow(() -> new BadRequestException("Doctor profile not found"));
    }

    private void ensureDoctorCanAccessPatient(Long doctorId, Long patientId) {
        boolean hasRecord = medicalRecordRepository.existsByDoctorIdAndPatientId(doctorId, patientId);
        boolean hasAppointment = appointmentRepository.existsByDoctorIdAndPatientId(doctorId, patientId);
        if (!hasRecord && !hasAppointment) {
            throw new AccessDeniedException("Doctor is not authorized to manage follow-ups for this patient");
        }
    }

    private String normalizeNotes(String value) {
        String cleaned = cleanOptionalField(value, NOTES_MAX_LENGTH);
        if (cleaned.length() < NOTES_MIN_LENGTH) {
            throw new BadRequestException("Consultation notes must contain at least 3 characters");
        }
        return cleaned;
    }

    private FollowUpAnalysisResponse sanitize(FollowUpAnalysisResponse response) {
        if (response == null) {
            throw new AiServiceUnavailableException("AI follow-up assistant returned an invalid analysis.");
        }

        FollowUpAnalysisResponse sanitized = new FollowUpAnalysisResponse();
        sanitized.setFollowUpRequired(response.isFollowUpRequired());
        sanitized.setAfterDays(response.getAfterDays());
        sanitized.setFollowUpDateText(cleanAiField(response.getFollowUpDateText(), 120));
        sanitized.setReason(cleanAiField(response.getReason(), 500));
        sanitized.setReminderMessage(cleanAiField(response.getReminderMessage(), 500));
        sanitized.setRequiresReview(response.isRequiresReview());
        sanitized.setReviewReason(cleanAiField(response.getReviewReason(), 300));

        if (sanitized.getAfterDays() != null && (sanitized.getAfterDays() < 1 || sanitized.getAfterDays() > 365)) {
            throw new AiServiceUnavailableException("AI follow-up assistant returned an invalid analysis.");
        }
        return sanitized;
    }

    private void applySuggestedDate(FollowUpAnalysisResponse response, LocalDate visitDate) {
        if (!response.isFollowUpRequired()) {
            response.setSuggestedDate(null);
            response.setAfterDays(null);
            response.setRequiresReview(false);
            response.setReviewReason("");
            return;
        }

        if (response.isRequiresReview()) {
            response.setSuggestedDate(null);
            return;
        }

        if (response.getAfterDays() != null) {
            response.setSuggestedDate(visitDate.plusDays(response.getAfterDays()).toString());
            return;
        }

        Optional<LocalDate> parsedDate = parseFollowUpDateText(response.getFollowUpDateText(), visitDate);
        if (parsedDate.isPresent()) {
            response.setSuggestedDate(parsedDate.get().toString());
            return;
        }

        response.setRequiresReview(true);
        response.setSuggestedDate(null);
        response.setReviewReason(defaultIfBlank(
                response.getReviewReason(),
                "Follow-up timing needs doctor review before a reminder can be created."
        ));
    }

    private Optional<LocalDate> parseFollowUpDateText(String value, LocalDate visitDate) {
        String text = cleanOptionalField(value, 120);
        if (text.isBlank()) {
            return Optional.empty();
        }

        for (DateTimeFormatter formatter : new DateTimeFormatter[]{DateTimeFormatter.ISO_LOCAL_DATE, DAY_MONTH_YEAR, DAY_SHORT_MONTH_YEAR}) {
            try {
                LocalDate parsed = LocalDate.parse(text, formatter);
                return parsed.isBefore(visitDate) ? Optional.empty() : Optional.of(parsed);
            } catch (DateTimeParseException ignored) {
                // Try the next accepted follow-up date format.
            }
        }

        Matcher matcher = DAY_MONTH_PATTERN.matcher(text);
        if (!matcher.find()) {
            return Optional.empty();
        }

        int day = Integer.parseInt(matcher.group(1));
        Month month = parseMonth(matcher.group(2));
        if (month == null) {
            return Optional.empty();
        }

        try {
            LocalDate parsed = LocalDate.of(visitDate.getYear(), month, day);
            return parsed.isBefore(visitDate) ? Optional.empty() : Optional.of(parsed);
        } catch (RuntimeException exception) {
            return Optional.empty();
        }
    }

    private Month parseMonth(String value) {
        String normalized = value.toLowerCase(Locale.ENGLISH);
        return switch (normalized) {
            case "january", "jan" -> Month.JANUARY;
            case "february", "feb" -> Month.FEBRUARY;
            case "march", "mar" -> Month.MARCH;
            case "april", "apr" -> Month.APRIL;
            case "may" -> Month.MAY;
            case "june", "jun" -> Month.JUNE;
            case "july", "jul" -> Month.JULY;
            case "august", "aug" -> Month.AUGUST;
            case "september", "sep", "sept" -> Month.SEPTEMBER;
            case "october", "oct" -> Month.OCTOBER;
            case "november", "nov" -> Month.NOVEMBER;
            case "december", "dec" -> Month.DECEMBER;
            default -> null;
        };
    }

    private String cleanRequiredField(String value, int maxLength, String message) {
        String cleaned = cleanOptionalField(value, maxLength);
        if (cleaned.isBlank()) {
            throw new BadRequestException(message);
        }
        return cleaned;
    }

    private String cleanOptionalField(String value, int maxLength) {
        String cleaned = value == null ? "" : value.trim().replaceAll("\\s+", " ");
        if (cleaned.length() > maxLength) {
            throw new BadRequestException("Input is too long");
        }
        return cleaned;
    }

    private String cleanAiField(String value, int maxLength) {
        String cleaned = value == null ? "" : value.trim().replaceAll("\\s+", " ");
        if (cleaned.length() > maxLength) {
            throw new AiServiceUnavailableException("AI follow-up assistant returned an invalid analysis.");
        }
        return cleaned;
    }

    private String defaultIfBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
