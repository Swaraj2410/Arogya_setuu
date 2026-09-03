package com.arogya.rural.service;

import com.arogya.rural.dto.response.PrescriptionOcrMedicineResponse;
import com.arogya.rural.dto.response.PrescriptionOcrResponse;
import com.arogya.rural.enums.Role;
import com.arogya.rural.exception.AiServiceUnavailableException;
import com.arogya.rural.exception.BadRequestException;
import com.arogya.rural.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PrescriptionOcrAiService {

    private static final long MAX_IMAGE_BYTES = 5L * 1024L * 1024L;
    private static final Set<String> SUPPORTED_TYPES = Set.of("image/png", "image/jpeg", "image/jpg");

    private final FastApiPrescriptionOcrClient prescriptionOcrClient;

    public PrescriptionOcrResponse extract(UserPrincipal currentUser, MultipartFile file) {
        ensureDoctor(currentUser);
        validateFile(file);
        return sanitize(prescriptionOcrClient.extract(file));
    }

    private void ensureDoctor(UserPrincipal currentUser) {
        if (currentUser == null || currentUser.getRole() != Role.DOCTOR) {
            throw new AccessDeniedException("Only doctors can digitize prescriptions");
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Prescription image is required");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new BadRequestException("Prescription image must be 5 MB or smaller");
        }
        if (!SUPPORTED_TYPES.contains(file.getContentType())) {
            throw new BadRequestException("Unsupported image type. Upload a PNG or JPG prescription image");
        }
    }

    private PrescriptionOcrResponse sanitize(PrescriptionOcrResponse response) {
        if (response == null) {
            throw new AiServiceUnavailableException("AI prescription digitizer returned an invalid draft.");
        }

        PrescriptionOcrResponse sanitized = new PrescriptionOcrResponse();
        sanitized.setRawText(cleanField(response.getRawText(), 12000));
        sanitized.setAdditionalInstructions(cleanField(response.getAdditionalInstructions(), 800));
        sanitized.setQualityWarning(cleanField(response.getQualityWarning(), 500));
        sanitized.setVerificationRequired(response.isVerificationRequired());
        sanitized.setMedicines(sanitizeMedicines(response.getMedicines()));
        return sanitized;
    }

    private List<PrescriptionOcrMedicineResponse> sanitizeMedicines(List<PrescriptionOcrMedicineResponse> medicines) {
        if (medicines == null) {
            return List.of();
        }
        if (medicines.size() > 20) {
            throw new AiServiceUnavailableException("AI prescription digitizer returned an invalid draft.");
        }
        return medicines.stream().map(this::sanitizeMedicine).toList();
    }

    private PrescriptionOcrMedicineResponse sanitizeMedicine(PrescriptionOcrMedicineResponse medicine) {
        PrescriptionOcrMedicineResponse sanitized = new PrescriptionOcrMedicineResponse();
        if (medicine == null) {
            return sanitized;
        }
        sanitized.setName(cleanField(medicine.getName(), 200));
        sanitized.setDosage(cleanField(medicine.getDosage(), 120));
        sanitized.setFrequency(cleanField(medicine.getFrequency(), 160));
        sanitized.setDuration(cleanField(medicine.getDuration(), 160));
        sanitized.setInstructions(cleanField(medicine.getInstructions(), 300));
        return sanitized;
    }

    private String cleanField(String value, int maxLength) {
        String cleaned = value == null ? "" : value.trim().replaceAll("\\s+", " ");
        if (cleaned.length() > maxLength) {
            throw new AiServiceUnavailableException("AI prescription digitizer returned an invalid draft.");
        }
        return cleaned;
    }
}
