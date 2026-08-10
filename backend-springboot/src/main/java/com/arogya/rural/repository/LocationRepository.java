package com.arogya.rural.repository;

import com.arogya.rural.dto.response.LocationOptionResponse;
import com.arogya.rural.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LocationRepository extends JpaRepository<Location, Long> {

    @Query("""
            select distinct new com.arogya.rural.dto.response.LocationOptionResponse(l.stateCode, l.stateName)
            from Location l
            order by l.stateName
            """)
    List<LocationOptionResponse> findStateOptions();

    @Query("""
            select distinct new com.arogya.rural.dto.response.LocationOptionResponse(l.districtCode, l.districtName)
            from Location l
            where l.stateCode = :stateCode
            order by l.districtName
            """)
    List<LocationOptionResponse> findDistrictOptions(@Param("stateCode") Integer stateCode);

    @Query("""
            select distinct new com.arogya.rural.dto.response.LocationOptionResponse(l.subDistrictCode, l.subDistrictName)
            from Location l
            where l.districtCode = :districtCode
            order by l.subDistrictName
            """)
    List<LocationOptionResponse> findSubDistrictOptions(@Param("districtCode") Integer districtCode);

    @Query("""
            select distinct new com.arogya.rural.dto.response.LocationOptionResponse(l.villageCode, l.villageName)
            from Location l
            where l.subDistrictCode = :subDistrictCode
            order by l.villageName
            """)
    List<LocationOptionResponse> findVillageOptions(@Param("subDistrictCode") Integer subDistrictCode);

    boolean existsByVillageCode(Integer villageCode);
}
