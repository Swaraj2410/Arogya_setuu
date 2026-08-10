package com.arogya.rural.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class UpdateMedicalRecordRequest {

    private String diagnosis;
    private String treatment;
    private String notes;
    private LocalDate visitDate;
}
