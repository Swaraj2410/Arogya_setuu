package com.arogya.rural.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class FollowUpAnalyzeRequest {

    @NotNull
    private Long patientId;

    @NotNull
    private LocalDate visitDate;

    @NotBlank
    @Size(min = 3, max = 4000)
    private String consultationNotes;
}
