package com.arogya.rural.dto.request;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
public class CreateAvailabilityRequest {

    private Long doctorId;

    @NotNull
    @FutureOrPresent
    private LocalDate availableDate;

    @NotNull
    private LocalTime startTime;

    @NotNull
    private LocalTime endTime;

    @NotBlank
    private String state;

    @NotBlank
    private String district;

    @NotBlank
    private String taluka;

    @NotBlank
    private String village;
}
