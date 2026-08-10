package com.arogya.rural.controller;

import com.arogya.rural.dto.response.DoctorResponse;
import com.arogya.rural.service.DoctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;

    @GetMapping
    public List<DoctorResponse> listDoctors(@RequestParam(required = false) Long specialization) {
        return doctorService.listDoctors(specialization);
    }
}
