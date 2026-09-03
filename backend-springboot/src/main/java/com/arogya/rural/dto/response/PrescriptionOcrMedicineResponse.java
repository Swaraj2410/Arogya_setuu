package com.arogya.rural.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PrescriptionOcrMedicineResponse {

    private String name = "";
    private String dosage = "";
    private String frequency = "";
    private String duration = "";
    private String instructions = "";
}
