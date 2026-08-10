package com.arogya.rural.repository;

import com.arogya.rural.entity.Specialization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SpecializationRepository extends JpaRepository<Specialization, Long> {

    Optional<Specialization> findByNameIgnoreCase(String name);

    @Query("select s from Specialization s order by s.id asc")
    List<Specialization> findAllOrdered();
}
