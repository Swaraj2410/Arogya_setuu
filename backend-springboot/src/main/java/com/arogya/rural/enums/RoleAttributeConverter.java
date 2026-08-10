package com.arogya.rural.enums;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class RoleAttributeConverter implements AttributeConverter<Role, String> {

    @Override
    public String convertToDatabaseColumn(Role role) {
        return role == null ? null : role.getValue();
    }

    @Override
    public Role convertToEntityAttribute(String value) {
        return Role.fromValue(value);
    }
}
