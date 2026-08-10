package com.arogya.rural.service;

import com.arogya.rural.dto.request.CreateAppointmentRequest;
import com.arogya.rural.dto.request.CreateAvailabilityRequest;
import com.arogya.rural.dto.request.RegisterRequest;
import com.arogya.rural.dto.response.AppointmentResponse;
import com.arogya.rural.dto.response.AvailabilityResponse;
import com.arogya.rural.dto.response.AuthResponse;
import com.arogya.rural.dto.response.NotificationResponse;
import com.arogya.rural.entity.Specialization;
import com.arogya.rural.entity.User;
import com.arogya.rural.exception.ConflictException;
import com.arogya.rural.repository.AppointmentRepository;
import com.arogya.rural.repository.DoctorAvailabilityRepository;
import com.arogya.rural.repository.DoctorRepository;
import com.arogya.rural.repository.MedicalRecordRepository;
import com.arogya.rural.repository.NotificationRepository;
import com.arogya.rural.repository.PatientRepository;
import com.arogya.rural.repository.PrescriptionRepository;
import com.arogya.rural.repository.SpecializationRepository;
import com.arogya.rural.repository.UserRepository;
import com.arogya.rural.security.UserPrincipal;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class ServiceWorkflowTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private AvailabilityService availabilityService;

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private SpecializationRepository specializationRepository;

    @Autowired
    private DoctorAvailabilityRepository availabilityRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private MedicalRecordRepository medicalRecordRepository;

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private AuthResponse patientAuth;
    private AuthResponse doctorAuth;

    @BeforeEach
    void setUp() {
        clearDatabase();

        Specialization cardiology = specializationRepository.save(new Specialization("Cardiology"));
        patientAuth = authService.register(patientRequest());
        doctorAuth = authService.register(doctorRequest(cardiology.getId()));
    }

    @Test
    void registerRejectsDuplicateEmail() {
        RegisterRequest duplicate = patientRequest();
        duplicate.setEmail(" ananya.sharma@example.com ");

        assertThatThrownBy(() -> authService.register(duplicate))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Email already registered");
    }

    @Test
    void patientCanListMatchingVillageAvailability() {
        UserPrincipal doctor = principal("asha.iyer@example.com");
        CreateAvailabilityRequest request = availabilityRequest(" Maharashtra ", " GONDIA ", " Tirora ", " Mundikota ");

        AvailabilityResponse created = availabilityService.createAvailability(doctor, request);
        assertThat(created.getDoctor().getUser().getName()).isEqualTo("Dr. Asha Iyer");
        assertThat(created.isBooked()).isFalse();

        UserPrincipal patient = principal("ananya.sharma@example.com");
        List<AvailabilityResponse> matchingSlots = availabilityService.listAvailability(
                patient,
                null,
                null,
                "maharashtra",
                "gondia",
                "tirora",
                "mundikota"
        );

        assertThat(matchingSlots).extracting(AvailabilityResponse::getVillage).containsExactly("Mundikota");
    }

    @Test
    void bookingRequiresOpenAvailabilityAndPreventsDuplicateSlot() {
        UserPrincipal doctor = principal("asha.iyer@example.com");
        availabilityService.createAvailability(doctor, availabilityRequest("Maharashtra", "Gondia", "Tirora", "Mundikota"));

        UserPrincipal patient = principal("ananya.sharma@example.com");
        AppointmentResponse appointment = appointmentService.bookAppointment(patient, appointmentRequest());

        assertThat(appointment.getStatus()).isEqualTo("booked");
        assertThat(appointment.getPatientId()).isEqualTo(patientAuth.getUser().getPatientId());
        assertThat(appointment.getDoctorId()).isEqualTo(doctorAuth.getUser().getDoctorId());

        assertThatThrownBy(() -> appointmentService.bookAppointment(patient, appointmentRequest()))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Doctor already has a booked appointment in this slot");
    }

    @Test
    void doctorCannotBookPatientAppointments() {
        UserPrincipal doctor = principal("asha.iyer@example.com");

        assertThatThrownBy(() -> appointmentService.bookAppointment(doctor, appointmentRequest()))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Doctors cannot book patient appointments from this endpoint");
    }

    @Test
    void booleanResponsesKeepApiJsonFieldNames() throws Exception {
        AvailabilityResponse availability = new AvailabilityResponse();
        availability.setBooked(true);
        NotificationResponse notification = new NotificationResponse();
        notification.setRead(true);

        assertThat(objectMapper.writeValueAsString(availability))
                .contains("\"isBooked\":true")
                .doesNotContain("\"booked\":");
        assertThat(objectMapper.writeValueAsString(notification))
                .contains("\"isRead\":true")
                .doesNotContain("\"read\":");
    }

    private RegisterRequest patientRequest() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Ananya Sharma");
        request.setEmail("ananya.sharma@example.com");
        request.setPassword("password");
        request.setRole("patient");
        request.setAge(32);
        request.setGender("Female");
        request.setPhone("+91 98765 12345");
        request.setAddress("Near primary school");
        request.setBloodGroup("O+");
        request.setState(" Maharashtra ");
        request.setDistrict(" Gondia ");
        request.setTaluka(" Tirora ");
        request.setVillage(" Mundikota ");
        return request;
    }

    private RegisterRequest doctorRequest(Long specializationId) {
        RegisterRequest request = new RegisterRequest();
        request.setName("Dr. Asha Iyer");
        request.setEmail("asha.iyer@example.com");
        request.setPassword("password");
        request.setRole("doctor");
        request.setSpecializationId(specializationId);
        request.setQualification("MD, DM (Cardiology)");
        request.setExperienceYears(14);
        request.setConsultationFee(BigDecimal.valueOf(1800));
        return request;
    }

    private CreateAvailabilityRequest availabilityRequest(String state, String district, String taluka, String village) {
        CreateAvailabilityRequest request = new CreateAvailabilityRequest();
        request.setDoctorId(doctorAuth.getUser().getDoctorId());
        request.setAvailableDate(LocalDate.now().plusDays(7));
        request.setStartTime(LocalTime.of(11, 0));
        request.setEndTime(LocalTime.of(11, 30));
        request.setState(state);
        request.setDistrict(district);
        request.setTaluka(taluka);
        request.setVillage(village);
        return request;
    }

    private CreateAppointmentRequest appointmentRequest() {
        CreateAppointmentRequest request = new CreateAppointmentRequest();
        request.setPatientId(patientAuth.getUser().getPatientId());
        request.setDoctorId(doctorAuth.getUser().getDoctorId());
        request.setAppointmentDate(LocalDate.now().plusDays(7));
        request.setAppointmentTime(LocalTime.of(11, 0));
        request.setReason("Follow-up");
        return request;
    }

    private UserPrincipal principal(String email) {
        User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        return new UserPrincipal(user);
    }

    private void clearDatabase() {
        notificationRepository.deleteAll();
        prescriptionRepository.deleteAll();
        medicalRecordRepository.deleteAll();
        appointmentRepository.deleteAll();
        availabilityRepository.deleteAll();
        doctorRepository.deleteAll();
        patientRepository.deleteAll();
        userRepository.deleteAll();
        specializationRepository.deleteAll();
    }
}
