package com.arogya.rural.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClinicalNoteDraftResponse {

    private String diagnosis = "";
    private String treatment = "";
    private String medicines = "";
    private String dosageInstructions = "";
    private String notes = "";
}
