package com.arogya.rural.controller;

import com.arogya.rural.dto.response.VoiceTranscriptionResponse;
import com.arogya.rural.security.UserPrincipal;
import com.arogya.rural.service.VoiceAiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/ai/voice")
@RequiredArgsConstructor
public class AiVoiceController {

    private final VoiceAiService voiceAiService;

    @PostMapping(value = "/transcribe", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public VoiceTranscriptionResponse transcribe(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestPart("file") MultipartFile file,
            @RequestParam(required = false) String language
    ) {
        return voiceAiService.transcribe(currentUser, file, language);
    }
}
