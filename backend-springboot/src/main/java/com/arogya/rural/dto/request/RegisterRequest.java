package com.arogya.rural.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class RegisterRequest {

    @NotBlank
    private String name;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 6)
    private String password;

    @NotBlank
    private String role;

    private Long specializationId;
    private String specializationName;
    private String qualification;
    private Integer experienceYears;
    private BigDecimal consultationFee;
    private Integer age;
    private String gender;
    private String phone;
    private String address;
    private String bloodGroup;
    private String state;
    private String district;
    private String taluka;
    private String village;
}
