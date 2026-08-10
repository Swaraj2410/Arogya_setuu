package com.arogya.rural.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class DoctorResponse {

    private Long id;
    private Long userId;
    private Long specializationId;
    private String qualification;
    private Integer experienceYears;
    private BigDecimal consultationFee;

    @JsonProperty("User")
    private SimpleUserResponse user;

    @JsonProperty("Specialization")
    private SpecializationResponse specialization;
}
