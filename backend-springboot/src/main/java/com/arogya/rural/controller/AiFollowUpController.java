package com.arogya.rural.controller;

import com.arogya.rural.dto.request.FollowUpAnalyzeRequest;
import com.arogya.rural.dto.request.FollowUpReminderRequest;
import com.arogya.rural.dto.response.FollowUpAnalysisResponse;
import com.arogya.rural.dto.response.NotificationResponse;
import com.arogya.rural.security.UserPrincipal;
import com.arogya.rural.service.FollowUpAiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/follow-up")
@RequiredArgsConstructor
public class AiFollowUpController {

    private final FollowUpAiService followUpAiService;

    @PostMapping("/analyze")
    public FollowUpAnalysisResponse analyze(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody FollowUpAnalyzeRequest request
    ) {
        return followUpAiService.analyze(currentUser, request);
    }

    @PostMapping("/reminders")
    public NotificationResponse createReminder(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody FollowUpReminderRequest request
    ) {
        return followUpAiService.createReminder(currentUser, request);
    }
}
