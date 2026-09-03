package com.arogya.rural.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AiTriageResponse {

    private AiTriageAssessmentResponse assessment;
    private List<DoctorResponse> doctors;
}
