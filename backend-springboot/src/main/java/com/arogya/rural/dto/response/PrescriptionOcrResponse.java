package com.arogya.rural.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class PrescriptionOcrResponse {

    private String rawText = "";
    private List<PrescriptionOcrMedicineResponse> medicines = new ArrayList<>();
    private String additionalInstructions = "";
    private boolean verificationRequired = true;
    private String qualityWarning = "";
}
