package com.arogya.rural.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PatientResponse {

    private Long id;
    private Long userId;
    private Integer age;
    private String gender;
    private String phone;
    private String address;
    private String bloodGroup;
    private String state;
    private String district;
    private String taluka;
    private String village;

    @JsonProperty("User")
    private SimpleUserResponse user;
}
