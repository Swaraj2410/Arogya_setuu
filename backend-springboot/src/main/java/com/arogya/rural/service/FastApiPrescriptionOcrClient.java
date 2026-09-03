package com.arogya.rural.service;

import com.arogya.rural.dto.response.PrescriptionOcrResponse;
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
public class FastApiPrescriptionOcrClient {

    private static final String AI_UNAVAILABLE_MESSAGE =
            "AI prescription digitizer is temporarily unavailable. Please try again later.";

    private final RestClient aiRestClient;

    public PrescriptionOcrResponse extract(MultipartFile file) {
        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", MultipartFileResource.partFrom(file));

            PrescriptionOcrResponse response = aiRestClient.post()
                    .uri("/prescription-ocr/extract")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(PrescriptionOcrResponse.class);
            if (response == null) {
                throw new AiServiceUnavailableException(AI_UNAVAILABLE_MESSAGE);
            }
            return response;
        } catch (IOException exception) {
            throw new AiServiceUnavailableException("Could not read prescription image.", exception);
        } catch (AiServiceUnavailableException exception) {
            throw exception;
        } catch (RestClientException exception) {
            throw new AiServiceUnavailableException(AI_UNAVAILABLE_MESSAGE, exception);
        }
    }
}
