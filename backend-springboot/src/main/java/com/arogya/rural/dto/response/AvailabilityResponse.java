package com.arogya.rural.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class AvailabilityResponse {

    private Long id;
    private Long doctorId;
    private String availableDate;
    private String startTime;
    private String endTime;
    private String state;
    private String district;
    private String taluka;
    private String village;
    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    private boolean booked;

    @JsonProperty("Doctor")
    private DoctorResponse doctor;

    @JsonProperty("isBooked")
    public boolean isBooked() {
        return booked;
    }

    @JsonProperty("isBooked")
    public void setBooked(boolean booked) {
        this.booked = booked;
    }
}
