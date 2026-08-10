package com.arogya.rural.repository;

import com.arogya.rural.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    Optional<Doctor> findByUserId(Long userId);

    @Query("""
            select d from Doctor d
            join fetch d.user
            join fetch d.specialization
            where (:specializationId is null or d.specialization.id = :specializationId)
            order by d.user.name asc
            """)
    List<Doctor> findForListing(Long specializationId);

    @Query("select d from Doctor d join fetch d.user join fetch d.specialization where d.id = :id")
    Optional<Doctor> findByIdWithDetails(Long id);

    @Query("select d from Doctor d join fetch d.user join fetch d.specialization where d.user.id = :userId")
    Optional<Doctor> findByUserIdWithDetails(Long userId);

    long countBySpecializationId(Long specializationId);
}
