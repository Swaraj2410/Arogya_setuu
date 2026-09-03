package com.arogya.rural.repository;

import com.arogya.rural.entity.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    @Query("""
            select distinct r from MedicalRecord r
            join fetch r.doctor d
            join fetch d.user
            join fetch d.specialization
            join fetch r.patient p
            join fetch p.user
            where (:patientId is null or p.id = :patientId)
              and (:doctorId is null or d.id = :doctorId)
              and (:date is null or r.visitDate = :date)
              and (
                    :queryText is null
                    or lower(r.diagnosis) like lower(concat('%', :queryText, '%'))
                    or lower(coalesce(r.treatment, '')) like lower(concat('%', :queryText, '%'))
                    or lower(coalesce(r.notes, '')) like lower(concat('%', :queryText, '%'))
                  )
            order by r.visitDate desc
            """)
    List<MedicalRecord> search(Long patientId, Long doctorId, LocalDate date, String queryText);

    @Query("""
            select r from MedicalRecord r
            join fetch r.doctor d
            join fetch d.user
            join fetch d.specialization
            join fetch r.patient p
            join fetch p.user
            where r.id = :id
            """)
    Optional<MedicalRecord> findByIdWithDetails(Long id);

    boolean existsByDoctorIdAndPatientId(Long doctorId, Long patientId);
}
