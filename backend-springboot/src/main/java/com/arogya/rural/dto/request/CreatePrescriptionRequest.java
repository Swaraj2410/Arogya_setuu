package com.arogya.rural.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreatePrescriptionRequest {

    @NotNull
    private Long medicalRecordId;

    @NotNull
    private Long patientId;

    private Long doctorId;

    @NotBlank
    private String medicines;

    @NotBlank
    private String dosageInstructions;
}
