package com.arogya.rural.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FollowUpAnalysisResponse {

    private boolean followUpRequired;
    private Integer afterDays;
    private String followUpDateText = "";
    private String reason = "";
    private String reminderMessage = "";
    private boolean requiresReview;
    private String reviewReason = "";
    private String suggestedDate;
}
