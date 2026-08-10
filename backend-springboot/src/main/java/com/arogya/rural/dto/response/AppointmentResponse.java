package com.arogya.rural.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class AppointmentResponse {

    private Long id;
    private Long patientId;
    private Long doctorId;
    private String appointmentDate;
    private String appointmentTime;
    private String status;
    private String reason;

    @JsonProperty("Doctor")
    private DoctorResponse doctor;

    @JsonProperty("Patient")
    private PatientResponse patient;
}
