package com.arogya.rural.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class MedicalRecordQaResponse {

    private String answer;
    private List<MedicalRecordQaSourceResponse> sources = new ArrayList<>();
    private Integer retrievedChunks;
}
