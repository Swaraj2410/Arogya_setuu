package com.arogya.rural.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "patients")
@Getter
@Setter
@NoArgsConstructor
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private Integer age;

    @Column(length = 20)
    private String gender;

    @Column(length = 20)
    private String phone;

    private String address;

    @Column(name = "blood_group", length = 5)
    private String bloodGroup;

    @Column(length = 80)
    private String state;

    @Column(length = 80)
    private String district;

    @Column(length = 80)
    private String taluka;

    @Column(length = 80)
    private String village;

    public Patient(User user) {
        this.user = user;
    }
}
