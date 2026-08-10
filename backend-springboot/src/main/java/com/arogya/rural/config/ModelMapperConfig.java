package com.arogya.rural.config;

import com.arogya.rural.dto.response.AppointmentResponse;
import com.arogya.rural.dto.response.AvailabilityResponse;
import com.arogya.rural.dto.response.DoctorResponse;
import com.arogya.rural.dto.response.MedicalRecordBasicResponse;
import com.arogya.rural.dto.response.MedicalRecordResponse;
import com.arogya.rural.dto.response.NotificationResponse;
import com.arogya.rural.dto.response.PatientResponse;
import com.arogya.rural.dto.response.PrescriptionResponse;
import com.arogya.rural.dto.response.SimpleUserResponse;
import com.arogya.rural.dto.response.UserResponse;
import com.arogya.rural.entity.Appointment;
import com.arogya.rural.entity.Doctor;
import com.arogya.rural.entity.DoctorAvailability;
import com.arogya.rural.entity.MedicalRecord;
import com.arogya.rural.entity.Notification;
import com.arogya.rural.entity.Patient;
import com.arogya.rural.entity.Prescription;
import com.arogya.rural.entity.User;
import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ModelMapperConfig {

    @Bean
    public ModelMapper modelMapper() {
        ModelMapper modelMapper = new ModelMapper();
        modelMapper.getConfiguration()
                .setMatchingStrategy(MatchingStrategies.STRICT)
                .setSkipNullEnabled(true);
        configureResponseMappings(modelMapper);
        return modelMapper;
    }

    private void configureResponseMappings(ModelMapper modelMapper) {
        modelMapper.emptyTypeMap(User.class, UserResponse.class).addMappings(mapper -> {
            mapper.skip(UserResponse::setRole);
            mapper.skip(UserResponse::setPatientId);
            mapper.skip(UserResponse::setDoctorId);
            mapper.skip(UserResponse::setPatientProfile);
        }).implicitMappings();
        modelMapper.emptyTypeMap(User.class, SimpleUserResponse.class)
                .addMappings(mapper -> mapper.skip(SimpleUserResponse::setRole))
                .implicitMappings();
        modelMapper.emptyTypeMap(Doctor.class, DoctorResponse.class).addMappings(mapper -> {
            mapper.skip(DoctorResponse::setUserId);
            mapper.skip(DoctorResponse::setSpecializationId);
            mapper.skip(DoctorResponse::setUser);
            mapper.skip(DoctorResponse::setSpecialization);
        }).implicitMappings();
        modelMapper.emptyTypeMap(Patient.class, PatientResponse.class).addMappings(mapper -> {
            mapper.skip(PatientResponse::setUserId);
            mapper.skip(PatientResponse::setUser);
        }).implicitMappings();
        modelMapper.emptyTypeMap(DoctorAvailability.class, AvailabilityResponse.class).addMappings(mapper -> {
            mapper.skip(AvailabilityResponse::setDoctorId);
            mapper.skip(AvailabilityResponse::setAvailableDate);
            mapper.skip(AvailabilityResponse::setStartTime);
            mapper.skip(AvailabilityResponse::setEndTime);
            mapper.skip(AvailabilityResponse::setBooked);
            mapper.skip(AvailabilityResponse::setDoctor);
        }).implicitMappings();
        modelMapper.emptyTypeMap(Appointment.class, AppointmentResponse.class).addMappings(mapper -> {
            mapper.skip(AppointmentResponse::setPatientId);
            mapper.skip(AppointmentResponse::setDoctorId);
            mapper.skip(AppointmentResponse::setAppointmentDate);
            mapper.skip(AppointmentResponse::setAppointmentTime);
            mapper.skip(AppointmentResponse::setStatus);
            mapper.skip(AppointmentResponse::setDoctor);
            mapper.skip(AppointmentResponse::setPatient);
        }).implicitMappings();
        modelMapper.emptyTypeMap(MedicalRecord.class, MedicalRecordResponse.class).addMappings(mapper -> {
            mapper.skip(MedicalRecordResponse::setPatientId);
            mapper.skip(MedicalRecordResponse::setDoctorId);
            mapper.skip(MedicalRecordResponse::setVisitDate);
            mapper.skip(MedicalRecordResponse::setDoctor);
            mapper.skip(MedicalRecordResponse::setPatient);
            mapper.skip(MedicalRecordResponse::setPrescriptions);
        }).implicitMappings();
        modelMapper.emptyTypeMap(MedicalRecord.class, MedicalRecordBasicResponse.class).addMappings(mapper -> {
            mapper.skip(MedicalRecordBasicResponse::setPatientId);
            mapper.skip(MedicalRecordBasicResponse::setDoctorId);
            mapper.skip(MedicalRecordBasicResponse::setVisitDate);
        }).implicitMappings();
        modelMapper.emptyTypeMap(Prescription.class, PrescriptionResponse.class).addMappings(mapper -> {
            mapper.skip(PrescriptionResponse::setMedicalRecordId);
            mapper.skip(PrescriptionResponse::setPatientId);
            mapper.skip(PrescriptionResponse::setDoctorId);
            mapper.skip(PrescriptionResponse::setMedicalRecord);
            mapper.skip(PrescriptionResponse::setDoctor);
            mapper.skip(PrescriptionResponse::setPatient);
        }).implicitMappings();
        modelMapper.emptyTypeMap(Notification.class, NotificationResponse.class)
                .addMappings(mapper -> mapper.skip(NotificationResponse::setUserId))
                .implicitMappings();
    }
}
