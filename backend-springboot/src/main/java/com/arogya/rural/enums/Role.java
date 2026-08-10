package com.arogya.rural.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum Role {
    PATIENT("patient"),
    DOCTOR("doctor"),
    ADMIN("admin");

    private final String value;

    Role(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    public String getAuthorityName() {
        return "ROLE_" + name();
    }

    public static Role fromValue(String value) {
        if (value == null) {
            return null;
        }

        String normalizedValue = value.trim();
        for (Role role : values()) {
            if (role.value.equalsIgnoreCase(normalizedValue) || role.name().equalsIgnoreCase(normalizedValue)) {
                return role;
            }
        }
        throw new IllegalArgumentException("Invalid role");
    }
}
