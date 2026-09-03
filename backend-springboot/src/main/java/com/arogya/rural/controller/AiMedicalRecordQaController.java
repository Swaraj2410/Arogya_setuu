package com.arogya.rural.controller;

import com.arogya.rural.dto.request.MedicalRecordQuestionRequest;
import com.arogya.rural.dto.response.MedicalRecordQaResponse;
import com.arogya.rural.security.UserPrincipal;
import com.arogya.rural.service.MedicalRecordQaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/medical-records")
@RequiredArgsConstructor
public class AiMedicalRecordQaController {

    private final MedicalRecordQaService medicalRecordQaService;

    @PostMapping("/{patientId}/ask")
    public MedicalRecordQaResponse ask(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long patientId,
            @Valid @RequestBody MedicalRecordQuestionRequest request
    ) {
        return medicalRecordQaService.ask(currentUser, patientId, request);
    }
}
