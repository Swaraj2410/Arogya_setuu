package com.arogya.rural.service;

import com.arogya.rural.dto.response.FollowUpAnalysisResponse;
import com.arogya.rural.exception.AiServiceUnavailableException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
@RequiredArgsConstructor
public class FastApiFollowUpClient {

    private static final String AI_UNAVAILABLE_MESSAGE =
            "AI follow-up assistant is temporarily unavailable. Please create a reminder manually if needed.";

    private final RestClient aiRestClient;

    public FollowUpAnalysisResponse analyze(String consultationNotes) {
        try {
            FollowUpAnalysisResponse response = aiRestClient.post()
                    .uri("/follow-up/analyze")
                    .body(new FastApiFollowUpRequest(consultationNotes))
                    .retrieve()
                    .body(FollowUpAnalysisResponse.class);
            if (response == null) {
                throw new AiServiceUnavailableException(AI_UNAVAILABLE_MESSAGE);
            }
            return response;
        } catch (AiServiceUnavailableException exception) {
            throw exception;
        } catch (RestClientException exception) {
            throw new AiServiceUnavailableException(AI_UNAVAILABLE_MESSAGE, exception);
        }
    }

    private record FastApiFollowUpRequest(String consultationNotes) {
    }
}
