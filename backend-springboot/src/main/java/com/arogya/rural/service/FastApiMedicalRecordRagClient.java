package com.arogya.rural.service;

import com.arogya.rural.dto.response.MedicalRecordQaResponse;
import com.arogya.rural.exception.AiServiceUnavailableException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FastApiMedicalRecordRagClient {

    private static final String AI_UNAVAILABLE_MESSAGE =
            "AI medical record assistant is temporarily unavailable. Please try again later.";

    private final RestClient aiRestClient;

    public MedicalRecordQaResponse ask(Long patientId, String question, List<RagDocument> documents) {
        try {
            MedicalRecordQaResponse response = aiRestClient.post()
                    .uri("/rag/query")
                    .body(new RagQueryRequest(patientId, question, documents))
                    .retrieve()
                    .body(MedicalRecordQaResponse.class);
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

    public record RagDocument(String id, String type, String text, Map<String, Object> metadata) {
    }

    private record RagQueryRequest(Long patientId, String question, List<RagDocument> documents) {
    }
}
