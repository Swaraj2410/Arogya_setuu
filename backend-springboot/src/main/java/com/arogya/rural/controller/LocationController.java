package com.arogya.rural.controller;

import com.arogya.rural.dto.response.LocationOptionResponse;
import com.arogya.rural.service.LocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;

    @GetMapping("/states")
    public List<LocationOptionResponse> listStates() {
        return locationService.listStates();
    }

    @GetMapping("/districts")
    public List<LocationOptionResponse> listDistricts(@RequestParam Integer stateCode) {
        return locationService.listDistricts(stateCode);
    }

    @GetMapping("/talukas")
    public List<LocationOptionResponse> listTalukas(@RequestParam Integer districtCode) {
        return locationService.listTalukas(districtCode);
    }

    @GetMapping("/villages")
    public List<LocationOptionResponse> listVillages(@RequestParam Integer talukaCode) {
        return locationService.listVillages(talukaCode);
    }
}
