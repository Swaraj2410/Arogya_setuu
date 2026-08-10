package com.arogya.rural.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class MedicalRecordResponse {

    private Long id;
    private Long patientId;
    private Long doctorId;
    private String diagnosis;
    private String treatment;
    private String notes;
    private String visitDate;

    @JsonProperty("Doctor")
    private DoctorResponse doctor;

    @JsonProperty("Patient")
    private PatientResponse patient;

    @JsonProperty("Prescriptions")
    private List<PrescriptionResponse> prescriptions = new ArrayList<>();
}
