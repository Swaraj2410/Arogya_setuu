package com.arogya.rural.service;

import com.arogya.rural.dto.response.ClinicalNoteDraftResponse;
import com.arogya.rural.exception.AiServiceUnavailableException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
@RequiredArgsConstructor
public class FastApiClinicalNoteClient {

    private static final String AI_UNAVAILABLE_MESSAGE =
            "AI clinical note assistant is temporarily unavailable. Please try again later.";

    private final RestClient aiRestClient;

    public ClinicalNoteDraftResponse generate(String roughNotes) {
        try {
            ClinicalNoteDraftResponse response = aiRestClient.post()
                    .uri("/clinical-notes/generate")
                    .body(new FastApiClinicalNoteRequest(roughNotes))
                    .retrieve()
                    .body(ClinicalNoteDraftResponse.class);
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

    private record FastApiClinicalNoteRequest(String roughNotes) {
    }
}
