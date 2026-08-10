package com.arogya.rural.controller;

import com.arogya.rural.dto.request.CreateAppointmentRequest;
import com.arogya.rural.dto.request.UpdateAppointmentRequest;
import com.arogya.rural.dto.response.AppointmentResponse;
import com.arogya.rural.security.UserPrincipal;
import com.arogya.rural.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
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
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @GetMapping
    public List<AppointmentResponse> listAppointments(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) Long patientId
    ) {
        return appointmentService.listAppointments(currentUser, status, date, doctorId, patientId);
    }

    @PostMapping
    public ResponseEntity<AppointmentResponse> bookAppointment(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody CreateAppointmentRequest request
    ) {
        AppointmentResponse response = appointmentService.bookAppointment(currentUser, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{id}")
    public AppointmentResponse updateAppointment(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id,
            @RequestBody UpdateAppointmentRequest request
    ) {
        return appointmentService.updateAppointment(currentUser, id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAppointment(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id
    ) {
        appointmentService.deleteAppointment(currentUser, id);
        return ResponseEntity.noContent().build();
    }
}
