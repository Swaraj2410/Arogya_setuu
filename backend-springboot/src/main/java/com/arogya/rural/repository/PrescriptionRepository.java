package com.arogya.rural.repository;

import com.arogya.rural.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    List<Prescription> findByMedicalRecordId(Long medicalRecordId);

    @Query("""
            select p from Prescription p
            join fetch p.medicalRecord
            join fetch p.doctor d
            join fetch d.user
            join fetch d.specialization
            join fetch p.patient pat
            join fetch pat.user
            where (:medicalRecordId is null or p.medicalRecord.id = :medicalRecordId)
              and (:patientId is null or pat.id = :patientId)
              and (:doctorId is null or d.id = :doctorId)
            order by p.id desc
            """)
    List<Prescription> search(Long medicalRecordId, Long patientId, Long doctorId);
}
