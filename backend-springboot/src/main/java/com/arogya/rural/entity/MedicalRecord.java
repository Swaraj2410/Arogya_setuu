package com.arogya.rural.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(
        name = "medical_records",
        indexes = {
                @Index(name = "idx_records_patient", columnList = "patient_id"),
                @Index(name = "idx_records_doctor", columnList = "doctor_id"),
                @Index(name = "idx_records_visit_date", columnList = "visit_date")
        }
)
public class MedicalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @Column(nullable = false)
    private String diagnosis;

    private String treatment;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "visit_date", nullable = false)
    private LocalDate visitDate;
}
