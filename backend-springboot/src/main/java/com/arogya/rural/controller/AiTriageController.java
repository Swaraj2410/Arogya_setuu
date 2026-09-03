package com.arogya.rural.controller;

import com.arogya.rural.dto.request.AiTriageRequest;
import com.arogya.rural.dto.response.AiTriageResponse;
import com.arogya.rural.security.UserPrincipal;
import com.arogya.rural.service.AiTriageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiTriageController {

    private final AiTriageService aiTriageService;

    @PostMapping("/triage")
    public AiTriageResponse triage(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody AiTriageRequest request
    ) {
        return aiTriageService.triage(currentUser, request);
    }
}
