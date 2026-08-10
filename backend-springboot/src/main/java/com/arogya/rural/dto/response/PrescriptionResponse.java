package com.arogya.rural.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
@Setter
@NoArgsConstructor
public class PrescriptionResponse {

    private Long id;
    private Long medicalRecordId;
    private Long patientId;
    private Long doctorId;
    private String medicines;
    private String dosageInstructions;

    @JsonProperty("MedicalRecord")
    private MedicalRecordBasicResponse medicalRecord;

    @JsonProperty("Doctor")
    private DoctorResponse doctor;

    @JsonProperty("Patient")
    private PatientResponse patient;
}
