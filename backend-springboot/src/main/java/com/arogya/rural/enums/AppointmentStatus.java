package com.arogya.rural.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum AppointmentStatus {
    BOOKED("booked"),
    COMPLETED("completed"),
    CANCELLED("cancelled");

    private final String value;

    AppointmentStatus(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    public static AppointmentStatus fromValue(String value) {
        if (value == null) {
            return null;
        }

        String normalizedValue = value.trim();
        for (AppointmentStatus status : values()) {
            if (status.value.equalsIgnoreCase(normalizedValue) || status.name().equalsIgnoreCase(normalizedValue)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Invalid appointment status");
    }
}
