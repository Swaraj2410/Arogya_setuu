package com.arogya.rural.controller;

import com.arogya.rural.dto.request.CreateAvailabilityRequest;
import com.arogya.rural.dto.response.AvailabilityResponse;
import com.arogya.rural.security.UserPrincipal;
import com.arogya.rural.service.AvailabilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/availability")
@RequiredArgsConstructor
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    @GetMapping
    public List<AvailabilityResponse> listAvailability(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String taluka,
            @RequestParam(required = false) String village
    ) {
        return availabilityService.listAvailability(currentUser, doctorId, date, state, district, taluka, village);
    }

    @PostMapping
    public ResponseEntity<AvailabilityResponse> createAvailability(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody CreateAvailabilityRequest request
    ) {
        AvailabilityResponse response = availabilityService.createAvailability(currentUser, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAvailability(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id
    ) {
        availabilityService.deleteAvailability(currentUser, id);
        return ResponseEntity.noContent().build();
    }
}
