package com.arogya.rural.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReportSummaryResponse {

    private Map<String, Long> appointments;
    private long totalRecords;
    private List<SpecializationReportResponse> bySpecialization;
}
