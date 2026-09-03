package com.arogya.rural.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AiTriageRequest {

    @NotBlank
    @Size(min = 5, max = 2000)
    private String symptoms;

    @Pattern(regexp = "en|hi|mr", message = "language must be en, hi, or mr")
    private String language = "en";
}
