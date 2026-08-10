package com.arogya.rural.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PatientProfileResponse {

    private Long id;
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
