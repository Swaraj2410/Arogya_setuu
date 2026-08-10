package com.arogya.rural.repository;

import com.arogya.rural.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {

    Optional<Patient> findByUserId(Long userId);

    @Query("select p from Patient p join fetch p.user where p.id = :id")
    Optional<Patient> findByIdWithUser(Long id);

    @Query("select p from Patient p join fetch p.user where p.user.id = :userId")
    Optional<Patient> findByUserIdWithUser(Long userId);
}
