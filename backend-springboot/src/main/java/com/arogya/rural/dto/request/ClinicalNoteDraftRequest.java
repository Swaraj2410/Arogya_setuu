package com.arogya.rural.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClinicalNoteDraftRequest {

    @NotBlank
    @Size(min = 3, max = 4000)
    private String roughNotes;
}
