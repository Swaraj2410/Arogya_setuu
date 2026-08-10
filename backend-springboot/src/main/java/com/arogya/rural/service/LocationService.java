package com.arogya.rural.service;

import com.arogya.rural.dto.response.LocationOptionResponse;
import com.arogya.rural.repository.LocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final LocationRepository locationRepository;

    @Transactional(readOnly = true)
    public List<LocationOptionResponse> listStates() {
        return locationRepository.findStateOptions();
    }

    @Transactional(readOnly = true)
    public List<LocationOptionResponse> listDistricts(Integer stateCode) {
        if (stateCode == null) {
            return List.of();
        }
        return locationRepository.findDistrictOptions(stateCode);
    }

    @Transactional(readOnly = true)
    public List<LocationOptionResponse> listTalukas(Integer districtCode) {
        if (districtCode == null) {
            return List.of();
        }
        return locationRepository.findSubDistrictOptions(districtCode);
    }

    @Transactional(readOnly = true)
    public List<LocationOptionResponse> listVillages(Integer talukaCode) {
        if (talukaCode == null) {
            return List.of();
        }
        return locationRepository.findVillageOptions(talukaCode);
    }
}
