package com.arogya.rural.enums;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class AppointmentStatusAttributeConverter implements AttributeConverter<AppointmentStatus, String> {

    @Override
    public String convertToDatabaseColumn(AppointmentStatus status) {
        return status == null ? null : status.getValue();
    }

    @Override
    public AppointmentStatus convertToEntityAttribute(String value) {
        return AppointmentStatus.fromValue(value);
    }
}
