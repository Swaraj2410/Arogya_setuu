package com.arogya.rural.controller;

import com.arogya.rural.dto.request.CreatePrescriptionRequest;
import com.arogya.rural.dto.response.PrescriptionResponse;
import com.arogya.rural.security.UserPrincipal;
import com.arogya.rural.service.PrescriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    @GetMapping
    public List<PrescriptionResponse> listPrescriptions(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) Long recordId,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) Long doctorId
    ) {
        return prescriptionService.listPrescriptions(currentUser, recordId, patientId, doctorId);
    }

    @PostMapping
    public ResponseEntity<PrescriptionResponse> createPrescription(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody CreatePrescriptionRequest request
    ) {
        PrescriptionResponse response = prescriptionService.createPrescription(currentUser, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
