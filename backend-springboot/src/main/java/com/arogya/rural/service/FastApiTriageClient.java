package com.arogya.rural.service;

import com.arogya.rural.dto.response.AiTriageAssessmentResponse;
import com.arogya.rural.exception.AiServiceUnavailableException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FastApiTriageClient {

    private static final String AI_UNAVAILABLE_MESSAGE =
            "AI symptom assistant is temporarily unavailable. Please try again later or book a doctor directly.";

    private final RestClient aiRestClient;

    public AiTriageAssessmentResponse requestAssessment(String symptoms, List<String> allowedNames) {
        return requestAssessment(symptoms, allowedNames, "en");
    }

    public AiTriageAssessmentResponse requestAssessment(String symptoms, List<String> allowedNames, String language) {
        try {
            AiTriageAssessmentResponse assessment = aiRestClient.post()
                    .uri("/triage")
                    .body(new FastApiTriageRequest(symptoms, allowedNames, language))
                    .retrieve()
                    .body(AiTriageAssessmentResponse.class);
            if (assessment == null) {
                throw new AiServiceUnavailableException(AI_UNAVAILABLE_MESSAGE);
            }
            return assessment;
        } catch (AiServiceUnavailableException exception) {
            throw exception;
        } catch (RestClientException exception) {
            throw new AiServiceUnavailableException(AI_UNAVAILABLE_MESSAGE, exception);
        }
    }

    private record FastApiTriageRequest(String symptoms, List<String> allowedSpecializations, String language) {
    }
}
