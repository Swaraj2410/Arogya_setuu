package com.arogya.rural.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class MedicalRecordQaSourceResponse {

    private String recordType;
    private Long recordId;
    private String date;
}
