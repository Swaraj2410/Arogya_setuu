package com.arogya.rural.service;

import com.arogya.rural.dto.response.DoctorResponse;
import com.arogya.rural.mapper.ResponseMapper;
import com.arogya.rural.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final ResponseMapper responseMapper;

    @Transactional(readOnly = true)
    public List<DoctorResponse> listDoctors(Long specializationId) {
        return doctorRepository.findForListing(specializationId)
                .stream()
                .map(responseMapper::toDoctorResponse)
                .toList();
    }
}
