package com.arogya.rural.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class MedicalRecordBasicResponse {

    private Long id;
    private Long patientId;
    private Long doctorId;
    private String diagnosis;
    private String treatment;
    private String notes;
    private String visitDate;
}
