package com.arogya.rural.service;

import com.arogya.rural.dto.request.CreateAppointmentRequest;
import com.arogya.rural.dto.request.UpdateAppointmentRequest;
import com.arogya.rural.dto.response.AppointmentResponse;
import com.arogya.rural.entity.Appointment;
import com.arogya.rural.entity.Doctor;
import com.arogya.rural.entity.Notification;
import com.arogya.rural.entity.Patient;
import com.arogya.rural.enums.AppointmentStatus;
import com.arogya.rural.enums.Role;
import com.arogya.rural.exception.BadRequestException;
import com.arogya.rural.exception.ConflictException;
import com.arogya.rural.exception.ResourceNotFoundException;
import com.arogya.rural.mapper.ResponseMapper;
import com.arogya.rural.repository.AppointmentRepository;
import com.arogya.rural.repository.DoctorAvailabilityRepository;
import com.arogya.rural.repository.DoctorRepository;
import com.arogya.rural.repository.NotificationRepository;
import com.arogya.rural.repository.PatientRepository;
import com.arogya.rural.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final DoctorAvailabilityRepository availabilityRepository;
    private final NotificationRepository notificationRepository;
    private final ResponseMapper responseMapper;

    @Transactional(readOnly = true)
    public List<AppointmentResponse> listAppointments(
            UserPrincipal currentUser,
            String status,
            LocalDate date,
            Long doctorId,
            Long patientId
    ) {
        AppointmentStatus parsedStatus = parseStatusOrNull(status);
        Long scopedDoctorId = doctorId;
        Long scopedPatientId = patientId;

        if (currentUser.getRole() == Role.PATIENT) {
            Patient patient = patientRepository.findByUserId(currentUser.getId()).orElse(null);
            if (patient == null) {
                return List.of();
            }
            scopedPatientId = patient.getId();
        } else if (currentUser.getRole() == Role.DOCTOR) {
            Doctor doctor = doctorRepository.findByUserId(currentUser.getId()).orElse(null);
            if (doctor == null) {
                return List.of();
            }
            scopedDoctorId = doctor.getId();
        }

        return appointmentRepository.search(parsedStatus, date, scopedDoctorId, scopedPatientId)
                .stream()
                .map(responseMapper::toAppointmentResponse)
                .toList();
    }

    @Transactional
    public AppointmentResponse bookAppointment(UserPrincipal currentUser, CreateAppointmentRequest request) {
        if (currentUser.getRole() == Role.DOCTOR) {
            throw new AccessDeniedException("Doctors cannot book patient appointments from this endpoint");
        }

        Long patientId = resolvePatientIdForBooking(currentUser, request.getPatientId());
        Long doctorId = request.getDoctorId();
        LocalDate appointmentDate = request.getAppointmentDate();
        LocalTime appointmentTime = request.getAppointmentTime();

        if (patientId == null || doctorId == null || appointmentDate == null || appointmentTime == null) {
            throw new BadRequestException("Missing fields");
        }
        if (appointmentDate.isBefore(LocalDate.now())) {
            throw new BadRequestException("Appointment date cannot be in the past");
        }

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        ensureSlotIsAvailable(doctorId, appointmentDate, appointmentTime);
        ensureSlotIsNotBooked(doctorId, appointmentDate, appointmentTime);

        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setAppointmentDate(appointmentDate);
        appointment.setAppointmentTime(appointmentTime);
        appointment.setReason(request.getReason());
        appointment.setStatus(AppointmentStatus.BOOKED);

        Appointment saved = appointmentRepository.save(appointment);
        createBookingNotifications(patient, doctor, appointmentDate, appointmentTime);

        return appointmentRepository.findByIdWithDetails(saved.getId())
                .map(responseMapper::toAppointmentResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
    }

    @Transactional
    public AppointmentResponse updateAppointment(UserPrincipal currentUser, Long appointmentId, UpdateAppointmentRequest request) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Not found"));
        ensureCanAccessAppointment(currentUser, appointment);

        AppointmentStatus requestedStatus = parseStatusStrict(request.getStatus());
        if (currentUser.getRole() == Role.PATIENT
                && requestedStatus != null
                && requestedStatus != AppointmentStatus.CANCELLED) {
            throw new AccessDeniedException("Patients can only cancel appointments");
        }

        LocalDate nextDate = request.getAppointmentDate() == null
                ? appointment.getAppointmentDate()
                : request.getAppointmentDate();
        LocalTime nextTime = request.getAppointmentTime() == null
                ? appointment.getAppointmentTime()
                : request.getAppointmentTime();
        AppointmentStatus nextStatus = requestedStatus == null
                ? appointment.getStatus()
                : requestedStatus;

        if (request.getAppointmentDate() != null && request.getAppointmentDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Appointment date cannot be in the past");
        }
        if ((request.getAppointmentDate() != null || request.getAppointmentTime() != null)
                && nextStatus == AppointmentStatus.BOOKED) {
            ensureSlotIsAvailable(appointment.getDoctor().getId(), nextDate, nextTime);
            ensureSlotIsNotBookedExceptCurrent(appointment.getDoctor().getId(), nextDate, nextTime, appointment.getId());
        }

        if (requestedStatus != null) {
            appointment.setStatus(requestedStatus);
        }
        if (request.getAppointmentDate() != null) {
            appointment.setAppointmentDate(request.getAppointmentDate());
        }
        if (request.getAppointmentTime() != null) {
            appointment.setAppointmentTime(request.getAppointmentTime());
        }
        if (request.getReason() != null) {
            appointment.setReason(request.getReason());
        }

        Appointment saved = appointmentRepository.save(appointment);
        return appointmentRepository.findByIdWithDetails(saved.getId())
                .map(responseMapper::toAppointmentResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
    }

    @Transactional
    public void deleteAppointment(UserPrincipal currentUser, Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Not found"));

        if (currentUser.getRole() == Role.PATIENT) {
            Patient patient = patientRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Not found"));
            if (!appointment.getPatient().getId().equals(patient.getId())) {
                throw new ResourceNotFoundException("Not found");
            }
        } else if (currentUser.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only patients can delete their appointments");
        }

        appointmentRepository.delete(appointment);
    }

    private Long resolvePatientIdForBooking(UserPrincipal currentUser, Long requestedPatientId) {
        if (currentUser.getRole() != Role.PATIENT) {
            return requestedPatientId;
        }

        Patient patient = patientRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new BadRequestException("Patient profile not found"));
        if (requestedPatientId != null && !requestedPatientId.equals(patient.getId())) {
            throw new AccessDeniedException("Cannot book for another patient");
        }
        return patient.getId();
    }

    private void ensureCanAccessAppointment(UserPrincipal currentUser, Appointment appointment) {
        if (currentUser.getRole() == Role.PATIENT) {
            Patient patient = patientRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Not found"));
            if (!appointment.getPatient().getId().equals(patient.getId())) {
                throw new ResourceNotFoundException("Not found");
            }
        }

        if (currentUser.getRole() == Role.DOCTOR) {
            Doctor doctor = doctorRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Not found"));
            if (!appointment.getDoctor().getId().equals(doctor.getId())) {
                throw new ResourceNotFoundException("Not found");
            }
        }
    }

    private void ensureSlotIsAvailable(Long doctorId, LocalDate appointmentDate, LocalTime appointmentTime) {
        boolean slotExists = availabilityRepository.existsByDoctorIdAndAvailableDateAndStartTime(
                doctorId,
                appointmentDate,
                appointmentTime
        );
        if (!slotExists) {
            throw new BadRequestException("Selected slot is not available for this doctor");
        }
    }

    private void ensureSlotIsNotBooked(Long doctorId, LocalDate appointmentDate, LocalTime appointmentTime) {
        boolean booked = appointmentRepository.existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatus(
                doctorId,
                appointmentDate,
                appointmentTime,
                AppointmentStatus.BOOKED
        );
        if (booked) {
            throw new ConflictException("Doctor already has a booked appointment in this slot");
        }
    }

    private void ensureSlotIsNotBookedExceptCurrent(
            Long doctorId,
            LocalDate appointmentDate,
            LocalTime appointmentTime,
            Long appointmentId
    ) {
        boolean booked = appointmentRepository.existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusAndIdNot(
                doctorId,
                appointmentDate,
                appointmentTime,
                AppointmentStatus.BOOKED,
                appointmentId
        );
        if (booked) {
            throw new ConflictException("Doctor already has a booked appointment in this slot");
        }
    }

    private void createBookingNotifications(Patient patient, Doctor doctor, LocalDate date, LocalTime time) {
        notificationRepository.saveAll(List.of(
                new Notification(
                        patient.getUser(),
                        "Appointment booked",
                        "Your appointment is booked for " + date + " at " + time,
                        "appointment"
                ),
                new Notification(
                        doctor.getUser(),
                        "New appointment",
                        "A patient appointment is booked for " + date + " at " + time,
                        "appointment"
                )
        ));
    }

    private AppointmentStatus parseStatusOrNull(String status) {
        if (status == null || status.isBlank() || "all".equalsIgnoreCase(status)) {
            return null;
        }

        try {
            return AppointmentStatus.fromValue(status);
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    private AppointmentStatus parseStatusStrict(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        try {
            return AppointmentStatus.fromValue(status);
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Invalid appointment status");
        }
    }
}
