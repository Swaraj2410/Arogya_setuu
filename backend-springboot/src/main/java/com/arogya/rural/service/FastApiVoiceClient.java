package com.arogya.rural.service;

import com.arogya.rural.dto.response.VoiceTranscriptionResponse;
import com.arogya.rural.exception.AiServiceUnavailableException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class FastApiVoiceClient {

    private static final String AI_UNAVAILABLE_MESSAGE =
            "Voice transcription is temporarily unavailable. Please try typing symptoms instead.";

    private final RestClient aiRestClient;

    public VoiceTranscriptionResponse transcribe(MultipartFile file, String language) {
        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", MultipartFileResource.partFrom(file));
            if (language != null && !language.isBlank()) {
                body.add("language", language);
            }

            VoiceTranscriptionResponse response = aiRestClient.post()
                    .uri("/voice/transcribe")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(VoiceTranscriptionResponse.class);
            if (response == null) {
                throw new AiServiceUnavailableException(AI_UNAVAILABLE_MESSAGE);
            }
            return response;
        } catch (IOException exception) {
            throw new AiServiceUnavailableException("Could not read voice recording.", exception);
        } catch (AiServiceUnavailableException exception) {
            throw exception;
        } catch (RestClientException exception) {
            throw new AiServiceUnavailableException(AI_UNAVAILABLE_MESSAGE, exception);
        }
    }
}
