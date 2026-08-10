package com.arogya.rural.service;

import com.arogya.rural.dto.request.CreateAvailabilityRequest;
import com.arogya.rural.dto.response.AvailabilityResponse;
import com.arogya.rural.entity.Appointment;
import com.arogya.rural.entity.Doctor;
import com.arogya.rural.entity.DoctorAvailability;
import com.arogya.rural.enums.AppointmentStatus;
import com.arogya.rural.enums.Role;
import com.arogya.rural.exception.BadRequestException;
import com.arogya.rural.exception.ConflictException;
import com.arogya.rural.exception.ResourceNotFoundException;
import com.arogya.rural.mapper.ResponseMapper;
import com.arogya.rural.repository.AppointmentRepository;
import com.arogya.rural.repository.DoctorAvailabilityRepository;
import com.arogya.rural.repository.DoctorRepository;
import com.arogya.rural.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AvailabilityService {

    private final DoctorAvailabilityRepository availabilityRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final ResponseMapper responseMapper;

    @Transactional(readOnly = true)
    public List<AvailabilityResponse> listAvailability(
            UserPrincipal currentUser,
            Long requestedDoctorId,
            LocalDate date,
            String state,
            String district,
            String taluka,
            String village
    ) {
        Long doctorId = resolveDoctorIdForListing(currentUser, requestedDoctorId);
        LocalDate fromDate = date == null ? LocalDate.now() : null;

        List<DoctorAvailability> slots = availabilityRepository.search(
                doctorId,
                date,
                fromDate,
                trimNullable(state),
                trimNullable(district),
                trimNullable(taluka),
                trimNullable(village)
        );

        if (slots.isEmpty()) {
            return List.of();
        }

        Set<String> bookedKeys = findBookedSlotKeys(slots);
        return slots.stream()
                .map(slot -> responseMapper.toAvailabilityResponse(slot, bookedKeys.contains(slotKey(slot))))
                .toList();
    }

    @Transactional
    public AvailabilityResponse createAvailability(UserPrincipal currentUser, CreateAvailabilityRequest request) {
        if (currentUser.getRole() == Role.PATIENT) {
            throw new AccessDeniedException("Patients cannot create availability slots");
        }

        Long doctorId = resolveDoctorIdForWrite(currentUser, request.getDoctorId());
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        LocalDate availableDate = request.getAvailableDate();
        LocalTime startTime = request.getStartTime();
        LocalTime endTime = request.getEndTime();

        if (availableDate == null || startTime == null || endTime == null) {
            throw new BadRequestException("Missing fields");
        }
        if (availableDate.isBefore(LocalDate.now())) {
            throw new BadRequestException("Availability date cannot be in the past");
        }
        if (!endTime.isAfter(startTime)) {
            throw new BadRequestException("End time must be after start time");
        }
        if (availabilityRepository.existsByDoctorIdAndAvailableDateAndStartTime(doctorId, availableDate, startTime)) {
            throw new ConflictException("Availability slot already exists");
        }

        DoctorAvailability availability = new DoctorAvailability();
        availability.setDoctor(doctor);
        availability.setAvailableDate(availableDate);
        availability.setStartTime(startTime);
        availability.setEndTime(endTime);
        availability.setState(requiredLocation(request.getState()));
        availability.setDistrict(requiredLocation(request.getDistrict()));
        availability.setTaluka(requiredLocation(request.getTaluka()));
        availability.setVillage(requiredLocation(request.getVillage()));

        DoctorAvailability saved = availabilityRepository.save(availability);
        return responseMapper.toAvailabilityResponse(saved, false);
    }

    @Transactional
    public void deleteAvailability(UserPrincipal currentUser, Long availabilityId) {
        DoctorAvailability availability = availabilityRepository.findById(availabilityId)
                .orElseThrow(() -> new ResourceNotFoundException("Not found"));

        if (currentUser.getRole() == Role.DOCTOR) {
            Doctor doctor = doctorRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Not found"));
            if (!availability.getDoctor().getId().equals(doctor.getId())) {
                throw new ResourceNotFoundException("Not found");
            }
        } else if (currentUser.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only doctors can delete availability slots");
        }

        boolean isBooked = appointmentRepository.existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatus(
                availability.getDoctor().getId(),
                availability.getAvailableDate(),
                availability.getStartTime(),
                AppointmentStatus.BOOKED
        );
        if (isBooked) {
            throw new ConflictException("Cannot delete a slot with a booked appointment");
        }

        availabilityRepository.delete(availability);
    }

    private Long resolveDoctorIdForListing(UserPrincipal currentUser, Long requestedDoctorId) {
        if (currentUser.getRole() != Role.DOCTOR) {
            return requestedDoctorId;
        }

        Doctor doctor = doctorRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new BadRequestException("Doctor profile not found"));
        if (requestedDoctorId != null && !requestedDoctorId.equals(doctor.getId())) {
            throw new AccessDeniedException("Cannot manage availability for another doctor");
        }
        return doctor.getId();
    }

    private Long resolveDoctorIdForWrite(UserPrincipal currentUser, Long requestedDoctorId) {
        if (currentUser.getRole() == Role.DOCTOR) {
            Doctor doctor = doctorRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new BadRequestException("Doctor profile not found"));
            if (requestedDoctorId != null && !requestedDoctorId.equals(doctor.getId())) {
                throw new AccessDeniedException("Cannot manage availability for another doctor");
            }
            return doctor.getId();
        }

        if (requestedDoctorId == null) {
            throw new BadRequestException("Missing fields");
        }
        return requestedDoctorId;
    }

    private Set<String> findBookedSlotKeys(List<DoctorAvailability> slots) {
        Set<Long> doctorIds = slots.stream()
                .map(slot -> slot.getDoctor().getId())
                .collect(Collectors.toSet());
        Set<LocalDate> dates = slots.stream()
                .map(DoctorAvailability::getAvailableDate)
                .collect(Collectors.toSet());

        return appointmentRepository.findBookedAppointmentsForSlots(AppointmentStatus.BOOKED, doctorIds, dates)
                .stream()
                .map(this::slotKey)
                .collect(Collectors.toCollection(HashSet::new));
    }

    private String slotKey(DoctorAvailability availability) {
        return availability.getDoctor().getId()
                + "|"
                + availability.getAvailableDate()
                + "|"
                + availability.getStartTime();
    }

    private String slotKey(Appointment appointment) {
        return appointment.getDoctor().getId()
                + "|"
                + appointment.getAppointmentDate()
                + "|"
                + appointment.getAppointmentTime();
    }

    private String requiredLocation(String value) {
        String trimmed = trimNullable(value);
        if (trimmed == null) {
            throw new BadRequestException("State, district, taluka, and village are required");
        }
        return trimmed;
    }

    private String trimNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }
}
