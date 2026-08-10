package com.arogya.rural.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
public class UpdateAppointmentRequest {

    private String status;
    private LocalDate appointmentDate;
    private LocalTime appointmentTime;
    private String reason;
}
