package com.arogya.rural.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class FollowUpReminderRequest {

    @NotNull
    private Long patientId;

    @NotNull
    private LocalDate followUpDate;

    @Size(max = 500)
    private String reason;

    @NotBlank
    @Size(max = 500)
    private String reminderMessage;
}
