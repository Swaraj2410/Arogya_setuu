package com.arogya.rural.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class AiTriageAssessmentResponse {

    private String urgency;
    private String recommendedSpecialization;
    private String reason;
    private String recommendation;
    private List<String> warningSigns = new ArrayList<>();
}
