package com.arogya.rural.repository;

import com.arogya.rural.entity.Appointment;
import com.arogya.rural.enums.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    @Query("""
            select a from Appointment a
            join fetch a.doctor d
            join fetch d.user
            join fetch d.specialization
            join fetch a.patient p
            join fetch p.user
            where (:status is null or a.status = :status)
              and (:date is null or a.appointmentDate = :date)
              and (:doctorId is null or d.id = :doctorId)
              and (:patientId is null or p.id = :patientId)
            order by a.appointmentDate desc, a.appointmentTime asc
            """)
    List<Appointment> search(AppointmentStatus status, LocalDate date, Long doctorId, Long patientId);

    @Query("""
            select a from Appointment a
            join fetch a.doctor d
            join fetch d.user
            join fetch d.specialization
            join fetch a.patient p
            join fetch p.user
            where a.id = :id
            """)
    Optional<Appointment> findByIdWithDetails(Long id);

    boolean existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatus(
            Long doctorId,
            LocalDate appointmentDate,
            LocalTime appointmentTime,
            AppointmentStatus status
    );

    boolean existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusAndIdNot(
            Long doctorId,
            LocalDate appointmentDate,
            LocalTime appointmentTime,
            AppointmentStatus status,
            Long id
    );

    @Query("""
            select a from Appointment a
            where a.status = :status
              and a.doctor.id in :doctorIds
              and a.appointmentDate in :dates
            """)
    List<Appointment> findBookedAppointmentsForSlots(
            AppointmentStatus status,
            Collection<Long> doctorIds,
            Collection<LocalDate> dates
    );

    long countByStatus(AppointmentStatus status);

    long countByStatusAndAppointmentDateBetween(AppointmentStatus status, LocalDate from, LocalDate to);
}
