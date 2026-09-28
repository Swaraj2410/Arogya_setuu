package com.arogya.rural.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "location_imports")
public class LocationImport {
    @Id
    private String id;
    private String checksum;
    private long rowCount;

    public LocationImport(String checksum, long rowCount) {
        this.id = "lgd";
        this.checksum = checksum;
        this.rowCount = rowCount;
    }
}
