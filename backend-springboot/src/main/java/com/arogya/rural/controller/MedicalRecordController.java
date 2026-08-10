package com.arogya.rural.controller;

import com.arogya.rural.dto.request.CreateMedicalRecordRequest;
import com.arogya.rural.dto.request.UpdateMedicalRecordRequest;
import com.arogya.rural.dto.response.MedicalRecordResponse;
import com.arogya.rural.security.UserPrincipal;
import com.arogya.rural.service.MedicalRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/records")
@RequiredArgsConstructor
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    @GetMapping
    public List<MedicalRecordResponse> listRecords(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false, name = "q") String queryText
    ) {
        return medicalRecordService.listRecords(currentUser, patientId, doctorId, date, queryText);
    }

    @PostMapping
    public ResponseEntity<MedicalRecordResponse> createRecord(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody CreateMedicalRecordRequest request
    ) {
        MedicalRecordResponse response = medicalRecordService.createRecord(currentUser, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{id}")
    public MedicalRecordResponse updateRecord(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id,
            @RequestBody UpdateMedicalRecordRequest request
    ) {
        return medicalRecordService.updateRecord(currentUser, id, request);
    }
}
