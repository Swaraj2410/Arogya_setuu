package com.arogya.rural.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
@Table(
        name = "locations",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_locations_village_code", columnNames = "village_code")
        },
        indexes = {
                @Index(name = "idx_locations_state", columnList = "state_code,state_name"),
                @Index(name = "idx_locations_district", columnList = "state_code,district_code,district_name"),
                @Index(name = "idx_locations_sub_district", columnList = "district_code,sub_district_code,sub_district_name"),
                @Index(name = "idx_locations_village", columnList = "sub_district_code,village_name")
        }
)
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "state_code", nullable = false)
    private Integer stateCode;

    @Column(name = "state_name", nullable = false, length = 120)
    private String stateName;

    @Column(name = "district_code", nullable = false)
    private Integer districtCode;

    @Column(name = "district_name", nullable = false, length = 120)
    private String districtName;

    @Column(name = "sub_district_code", nullable = false)
    private Integer subDistrictCode;

    @Column(name = "sub_district_name", nullable = false, length = 120)
    private String subDistrictName;

    @Column(name = "village_code", nullable = false)
    private Integer villageCode;

    @Column(name = "village_name", nullable = false, length = 160)
    private String villageName;

    public Location(
            Integer stateCode,
            String stateName,
            Integer districtCode,
            String districtName,
            Integer subDistrictCode,
            String subDistrictName,
            Integer villageCode,
            String villageName
    ) {
        this.stateCode = stateCode;
        this.stateName = stateName;
        this.districtCode = districtCode;
        this.districtName = districtName;
        this.subDistrictCode = subDistrictCode;
        this.subDistrictName = subDistrictName;
        this.villageCode = villageCode;
        this.villageName = villageName;
    }
}
