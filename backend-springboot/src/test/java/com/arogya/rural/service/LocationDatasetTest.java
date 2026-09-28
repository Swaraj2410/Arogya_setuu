package com.arogya.rural.service;

import com.arogya.rural.entity.Location;
import com.arogya.rural.repository.LocationImportRepository;
import com.arogya.rural.repository.LocationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class LocationDatasetTest {
    private static final String HEADER = "State Code,State Name(In English),District Code,District Name (In English),Sub-District Code,Sub-District Name (In English),Village Code,Village Name (In English)\n";
    private static final String DATA = HEADER
            + "1,State A,10,District A,100,Taluka A,1000,\"Village, One\"\n"
            + "1,State A,11,District B,101,Taluka B,1001,Village Two\n"
            + "2,State B,20,District C,200,Taluka C,2000,Village Three\n";

    @Autowired LocationRepository locations;
    @Autowired LocationImportRepository imports;
    @Autowired LocationService service;
    @Autowired JdbcTemplate jdbc;
    @Autowired PlatformTransactionManager transactions;
    @TempDir Path directory;

    @BeforeEach
    void reset() {
        imports.deleteAll();
        locations.deleteAll();
    }

    private void load(Path file) {
        new TransactionTemplate(transactions).executeWithoutResult(status -> {
            try {
                new LocationCsvImporter(locations, imports, jdbc, file.toString(), false).run();
            } catch (IOException exception) {
                throw new UncheckedIOException(exception);
            }
        });
    }

    @Test
    void replacesSampleDataAndFiltersEveryLevelByParent() throws IOException {
        locations.save(new Location(9, "Sample", 90, "Sample", 900, "Sample", 9000, "Sample"));
        Path file = Files.writeString(directory.resolve("locations.csv"), DATA);
        load(file);
        assertThat(locations.count()).isEqualTo(3);
        assertThat(service.listStates()).extracting("name").containsExactly("State A", "State B");
        assertThat(service.listDistricts(1)).extracting("code").containsExactly(10, 11);
        assertThat(service.listDistricts(2)).extracting("code").containsExactly(20);
        assertThat(service.listTalukas(10)).extracting("code").containsExactly(100);
        assertThat(service.listVillages(100)).extracting("name").containsExactly("Village, One");
        assertThat(service.listVillages(999)).isEmpty();
    }

    @Test
    void skipsUnchangedFileButImportsChangedFileEvenWithSameRowCount() throws IOException {
        Path file = Files.writeString(directory.resolve("locations.csv"), DATA);
        load(file);
        Long originalId = locations.findAll().get(0).getId();
        load(file);
        assertThat(locations.existsById(originalId)).isTrue();
        Files.writeString(file, DATA.replace("Village Two", "Renamed Village"));
        load(file);
        assertThat(service.listVillages(101)).extracting("name").containsExactly("Renamed Village");
        assertThat(locations.count()).isEqualTo(3);
    }

    @Test
    void repopulatesLocationsAfterDatabaseRowsAreRemoved() throws IOException {
        Path file = Files.writeString(directory.resolve("locations.csv"), DATA);
        load(file);
        locations.deleteAll();
        load(file);
        assertThat(locations.count()).isEqualTo(3);
    }

    @Test
    void invalidDatasetRollsBackReplacementAndKeepsImportMarker() throws IOException {
        Path file = Files.writeString(directory.resolve("locations.csv"), DATA);
        load(file);
        String checksum = imports.findById("lgd").orElseThrow().getChecksum();
        Files.writeString(file, HEADER + "1,State A,10,District A,100,Taluka A,,Missing Code\n");
        assertThatThrownBy(() -> load(file)).isInstanceOf(UncheckedIOException.class);
        assertThat(locations.count()).isEqualTo(3);
        assertThat(imports.findById("lgd").orElseThrow().getChecksum()).isEqualTo(checksum);
        Files.writeString(file, HEADER);
        assertThatThrownBy(() -> load(file)).isInstanceOf(UncheckedIOException.class);
        assertThat(locations.count()).isEqualTo(3);
    }
}
