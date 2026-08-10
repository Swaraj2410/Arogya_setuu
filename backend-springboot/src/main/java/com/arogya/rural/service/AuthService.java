package com.arogya.rural.service;

import com.arogya.rural.dto.request.LoginRequest;
import com.arogya.rural.dto.request.RegisterRequest;
import com.arogya.rural.dto.response.AuthResponse;
import com.arogya.rural.dto.response.UserResponse;
import com.arogya.rural.entity.Doctor;
import com.arogya.rural.entity.Patient;
import com.arogya.rural.entity.Specialization;
import com.arogya.rural.entity.User;
import com.arogya.rural.enums.Role;
import com.arogya.rural.exception.BadRequestException;
import com.arogya.rural.exception.ConflictException;
import com.arogya.rural.exception.ResourceNotFoundException;
import com.arogya.rural.exception.UnauthorizedException;
import com.arogya.rural.mapper.ResponseMapper;
import com.arogya.rural.repository.DoctorRepository;
import com.arogya.rural.repository.PatientRepository;
import com.arogya.rural.repository.SpecializationRepository;
import com.arogya.rural.repository.UserRepository;
import com.arogya.rural.security.JwtService;
import com.arogya.rural.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final SpecializationRepository specializationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final ResponseMapper responseMapper;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        Role role = Role.fromValue(request.getRole());
        String name = trimRequired(request.getName(), "Missing fields");
        String email = trimRequired(request.getEmail(), "Missing fields").toLowerCase();

        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new BadRequestException("Missing fields");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("Email already registered");
        }

        User user = new User(name, email, passwordEncoder.encode(request.getPassword()), role);
        user = userRepository.save(user);

        Patient patient = null;
        Doctor doctor = null;
        if (role == Role.PATIENT) {
            patient = createPatientProfile(user, request);
        }
        if (role == Role.DOCTOR) {
            doctor = createDoctorProfile(user, request);
        }

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, responseMapper.toUserResponse(user, patient, doctor));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = trimRequired(request.getEmail(), "Missing fields").toLowerCase();
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new BadRequestException("Missing fields");
        }

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid credentials");
        }

        Patient patient = findPatientForUser(user);
        Doctor doctor = findDoctorForUser(user);
        String token = jwtService.generateToken(user);
        return new AuthResponse(token, responseMapper.toUserResponse(user, patient, doctor));
    }

    @Transactional(readOnly = true)
    public UserResponse me(UserPrincipal currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Patient patient = findPatientForUser(user);
        Doctor doctor = findDoctorForUser(user);
        return responseMapper.toUserResponse(user, patient, doctor);
    }

    private Patient createPatientProfile(User user, RegisterRequest request) {
        String state = trimNullable(request.getState());
        String district = trimNullable(request.getDistrict());
        String taluka = trimNullable(request.getTaluka());
        String village = trimNullable(request.getVillage());
        if (state == null || district == null || taluka == null || village == null) {
            throw new BadRequestException("State, district, taluka, and village are required for patient registration");
        }

        Patient patient = new Patient(user);
        patient.setAge(request.getAge());
        patient.setGender(trimNullable(request.getGender()));
        patient.setPhone(trimNullable(request.getPhone()));
        patient.setAddress(trimNullable(request.getAddress()));
        patient.setBloodGroup(trimNullable(request.getBloodGroup()));
        patient.setState(state);
        patient.setDistrict(district);
        patient.setTaluka(taluka);
        patient.setVillage(village);
        return patientRepository.save(patient);
    }

    private Doctor createDoctorProfile(User user, RegisterRequest request) {
        Specialization specialization = resolveSpecialization(request);

        Doctor doctor = new Doctor(user, specialization);
        doctor.setQualification(trimNullable(request.getQualification()));
        doctor.setExperienceYears(request.getExperienceYears());
        doctor.setConsultationFee(request.getConsultationFee() == null ? BigDecimal.ZERO : request.getConsultationFee());
        return doctorRepository.save(doctor);
    }

    private Specialization resolveSpecialization(RegisterRequest request) {
        if (request.getSpecializationId() != null) {
            return specializationRepository.findById(request.getSpecializationId())
                    .orElseGet(() -> findOrCreateSpecialization(request.getSpecializationName()));
        }

        String specializationName = trimNullable(request.getSpecializationName());
        if (specializationName != null) {
            return findOrCreateSpecialization(specializationName);
        }

        return specializationRepository.findAllOrdered()
                .stream()
                .findFirst()
                .orElseGet(() -> specializationRepository.save(new Specialization("General Medicine")));
    }

    private Specialization findOrCreateSpecialization(String specializationName) {
        String name = trimNullable(specializationName);
        if (name == null) {
            name = "General Medicine";
        }

        String finalName = name;
        return specializationRepository.findByNameIgnoreCase(finalName)
                .orElseGet(() -> specializationRepository.save(new Specialization(finalName)));
    }

    private Patient findPatientForUser(User user) {
        if (user.getRole() != Role.PATIENT) {
            return null;
        }
        return patientRepository.findByUserId(user.getId()).orElse(null);
    }

    private Doctor findDoctorForUser(User user) {
        if (user.getRole() != Role.DOCTOR) {
            return null;
        }
        return doctorRepository.findByUserId(user.getId()).orElse(null);
    }

    private String trimRequired(String value, String message) {
        String trimmed = trimNullable(value);
        if (trimmed == null) {
            throw new BadRequestException(message);
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
