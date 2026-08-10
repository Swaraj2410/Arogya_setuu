package com.arogya.rural.mapper;

import com.arogya.rural.dto.response.AppointmentResponse;
import com.arogya.rural.dto.response.AvailabilityResponse;
import com.arogya.rural.dto.response.DoctorResponse;
import com.arogya.rural.dto.response.MedicalRecordBasicResponse;
import com.arogya.rural.dto.response.MedicalRecordResponse;
import com.arogya.rural.dto.response.NotificationResponse;
import com.arogya.rural.dto.response.PatientProfileResponse;
import com.arogya.rural.dto.response.PatientResponse;
import com.arogya.rural.dto.response.PrescriptionResponse;
import com.arogya.rural.dto.response.SimpleUserResponse;
import com.arogya.rural.dto.response.SpecializationResponse;
import com.arogya.rural.dto.response.UserResponse;
import com.arogya.rural.entity.Appointment;
import com.arogya.rural.entity.Doctor;
import com.arogya.rural.entity.DoctorAvailability;
import com.arogya.rural.entity.MedicalRecord;
import com.arogya.rural.entity.Notification;
import com.arogya.rural.entity.Patient;
import com.arogya.rural.entity.Prescription;
import com.arogya.rural.entity.Specialization;
import com.arogya.rural.entity.User;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ResponseMapper {

    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");

    private final ModelMapper modelMapper;

    public UserResponse toUserResponse(User user, Patient patient, Doctor doctor) {
        UserResponse response = modelMapper.map(user, UserResponse.class);
        response.setRole(user.getRole().getValue());
        response.setPatientId(patient == null ? null : patient.getId());
        response.setDoctorId(doctor == null ? null : doctor.getId());
        response.setPatientProfile(patient == null ? null : toPatientProfile(patient));
        return response;
    }

    public PatientProfileResponse toPatientProfile(Patient patient) {
        return modelMapper.map(patient, PatientProfileResponse.class);
    }

    public SimpleUserResponse toSimpleUserResponse(User user) {
        if (user == null) {
            return null;
        }
        SimpleUserResponse response = modelMapper.map(user, SimpleUserResponse.class);
        response.setRole(user.getRole().getValue());
        return response;
    }

    public SpecializationResponse toSpecializationResponse(Specialization specialization) {
        if (specialization == null) {
            return null;
        }
        return modelMapper.map(specialization, SpecializationResponse.class);
    }

    public DoctorResponse toDoctorResponse(Doctor doctor) {
        if (doctor == null) {
            return null;
        }
        DoctorResponse response = modelMapper.map(doctor, DoctorResponse.class);
        response.setUserId(doctor.getUser().getId());
        response.setSpecializationId(doctor.getSpecialization().getId());
        response.setUser(toSimpleUserResponse(doctor.getUser()));
        response.setSpecialization(toSpecializationResponse(doctor.getSpecialization()));
        return response;
    }

    public PatientResponse toPatientResponse(Patient patient) {
        if (patient == null) {
            return null;
        }
        PatientResponse response = modelMapper.map(patient, PatientResponse.class);
        response.setUserId(patient.getUser().getId());
        response.setUser(toSimpleUserResponse(patient.getUser()));
        return response;
    }

    public AvailabilityResponse toAvailabilityResponse(DoctorAvailability availability, boolean isBooked) {
        AvailabilityResponse response = modelMapper.map(availability, AvailabilityResponse.class);
        response.setDoctorId(availability.getDoctor().getId());
        response.setAvailableDate(formatDate(availability.getAvailableDate()));
        response.setStartTime(formatTime(availability.getStartTime()));
        response.setEndTime(formatTime(availability.getEndTime()));
        response.setBooked(isBooked);
        response.setDoctor(toDoctorResponse(availability.getDoctor()));
        return response;
    }

    public AppointmentResponse toAppointmentResponse(Appointment appointment) {
        AppointmentResponse response = modelMapper.map(appointment, AppointmentResponse.class);
        response.setPatientId(appointment.getPatient().getId());
        response.setDoctorId(appointment.getDoctor().getId());
        response.setAppointmentDate(formatDate(appointment.getAppointmentDate()));
        response.setAppointmentTime(formatTime(appointment.getAppointmentTime()));
        response.setStatus(appointment.getStatus().getValue());
        response.setDoctor(toDoctorResponse(appointment.getDoctor()));
        response.setPatient(toPatientResponse(appointment.getPatient()));
        return response;
    }

    public MedicalRecordResponse toMedicalRecordResponse(
            MedicalRecord record,
            List<Prescription> prescriptions
    ) {
        MedicalRecordResponse response = modelMapper.map(record, MedicalRecordResponse.class);
        response.setPatientId(record.getPatient().getId());
        response.setDoctorId(record.getDoctor().getId());
        response.setVisitDate(formatDate(record.getVisitDate()));
        response.setDoctor(toDoctorResponse(record.getDoctor()));
        response.setPatient(toPatientResponse(record.getPatient()));
        response.setPrescriptions(prescriptions.stream()
                .map(this::toPrescriptionNestedResponse)
                .toList());
        return response;
    }

    public MedicalRecordBasicResponse toMedicalRecordBasicResponse(MedicalRecord record) {
        MedicalRecordBasicResponse response = modelMapper.map(record, MedicalRecordBasicResponse.class);
        response.setPatientId(record.getPatient().getId());
        response.setDoctorId(record.getDoctor().getId());
        response.setVisitDate(formatDate(record.getVisitDate()));
        return response;
    }

    public PrescriptionResponse toPrescriptionResponse(Prescription prescription) {
        PrescriptionResponse response = toPrescriptionNestedResponse(prescription);
        response.setMedicalRecord(toMedicalRecordBasicResponse(prescription.getMedicalRecord()));
        response.setDoctor(toDoctorResponse(prescription.getDoctor()));
        response.setPatient(toPatientResponse(prescription.getPatient()));
        return response;
    }

    public PrescriptionResponse toPrescriptionNestedResponse(Prescription prescription) {
        PrescriptionResponse response = modelMapper.map(prescription, PrescriptionResponse.class);
        response.setMedicalRecordId(prescription.getMedicalRecord().getId());
        response.setPatientId(prescription.getPatient().getId());
        response.setDoctorId(prescription.getDoctor().getId());
        return response;
    }

    public NotificationResponse toNotificationResponse(Notification notification) {
        NotificationResponse response = modelMapper.map(notification, NotificationResponse.class);
        response.setUserId(notification.getUser().getId());
        return response;
    }

    private static String formatDate(LocalDate date) {
        return date == null ? null : date.toString();
    }

    private static String formatTime(LocalTime time) {
        return time == null ? null : time.format(TIME_FORMAT);
    }
}
