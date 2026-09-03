package com.arogya.rural.controller;

import com.arogya.rural.dto.response.PrescriptionOcrResponse;
import com.arogya.rural.security.UserPrincipal;
import com.arogya.rural.service.PrescriptionOcrAiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/ai/prescriptions")
@RequiredArgsConstructor
public class AiPrescriptionOcrController {

    private final PrescriptionOcrAiService prescriptionOcrAiService;

    @PostMapping(value = "/extract", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PrescriptionOcrResponse extract(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestPart("file") MultipartFile file
    ) {
        return prescriptionOcrAiService.extract(currentUser, file);
    }
}
