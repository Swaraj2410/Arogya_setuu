package com.arogya.rural.repository;

import com.arogya.rural.entity.DoctorAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface DoctorAvailabilityRepository extends JpaRepository<DoctorAvailability, Long> {

    @Query("""
            select a from DoctorAvailability a
            join fetch a.doctor d
            join fetch d.user
            join fetch d.specialization
            where (:doctorId is null or d.id = :doctorId)
              and (:exactDate is null or a.availableDate = :exactDate)
              and (:fromDate is null or a.availableDate >= :fromDate)
              and (:state is null or lower(trim(a.state)) = lower(trim(:state)))
              and (:district is null or lower(trim(a.district)) = lower(trim(:district)))
              and (:taluka is null or lower(trim(a.taluka)) = lower(trim(:taluka)))
              and (:village is null or lower(trim(a.village)) = lower(trim(:village)))
            order by a.availableDate asc, a.startTime asc
            """)
    List<DoctorAvailability> search(
            Long doctorId,
            LocalDate exactDate,
            LocalDate fromDate,
            String state,
            String district,
            String taluka,
            String village
    );

    boolean existsByDoctorIdAndAvailableDateAndStartTime(Long doctorId, LocalDate availableDate, LocalTime startTime);

    Optional<DoctorAvailability> findByDoctorIdAndAvailableDateAndStartTime(Long doctorId, LocalDate availableDate, LocalTime startTime);
}
