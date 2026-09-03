package com.arogya.rural.controller;

import com.arogya.rural.dto.request.ClinicalNoteDraftRequest;
import com.arogya.rural.dto.response.ClinicalNoteDraftResponse;
import com.arogya.rural.security.UserPrincipal;
import com.arogya.rural.service.ClinicalNoteAiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/clinical-notes")
@RequiredArgsConstructor
public class AiClinicalNoteController {

    private final ClinicalNoteAiService clinicalNoteAiService;

    @PostMapping("/generate")
    public ClinicalNoteDraftResponse generate(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody ClinicalNoteDraftRequest request
    ) {
        return clinicalNoteAiService.generate(currentUser, request);
    }
}
