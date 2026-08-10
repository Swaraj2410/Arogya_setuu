package com.arogya.rural.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class CreateMedicalRecordRequest {

    @NotNull
    private Long patientId;

    private Long doctorId;

    @NotBlank
    private String diagnosis;

    private String treatment;
    private String notes;

    @NotNull
    private LocalDate visitDate;
}
