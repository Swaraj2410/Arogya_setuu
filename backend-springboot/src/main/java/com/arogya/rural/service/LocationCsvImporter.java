package com.arogya.rural.service;

import com.arogya.rural.entity.Location;
import com.arogya.rural.entity.LocationImport;
import com.arogya.rural.repository.LocationImportRepository;
import com.arogya.rural.repository.LocationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class LocationCsvImporter implements CommandLineRunner {

    private static final int BATCH_SIZE = 1000;
    private static final String INSERT_SQL = """
            insert into locations (
                state_code,
                state_name,
                district_code,
                district_name,
                sub_district_code,
                sub_district_name,
                village_code,
                village_name
            ) values (?, ?, ?, ?, ?, ?, ?, ?)
            """;

    private final LocationRepository locationRepository;
    private final LocationImportRepository importRepository;
    private final JdbcTemplate jdbcTemplate;
    private final String importCsvPath;
    private final boolean forceImport;

    public LocationCsvImporter(
            LocationRepository locationRepository,
            LocationImportRepository importRepository,
            JdbcTemplate jdbcTemplate,
            @Value("${app.locations.import-csv:}") String importCsvPath,
            @Value("${app.locations.force-import:false}") boolean forceImport
    ) {
        this.locationRepository = locationRepository;
        this.importRepository = importRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.importCsvPath = importCsvPath;
        this.forceImport = forceImport;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void run(String... args) throws IOException {
        if (importCsvPath == null || importCsvPath.isBlank()) {
            return;
        }

        Path csvPath = Path.of(importCsvPath.trim());
        if (!Files.exists(csvPath)) {
            log.warn("Location CSV file not found: {}. Skipping LGD location import.", csvPath);
            return;
        }

        String checksum = checksum(csvPath);
        long existingRows = locationRepository.count();
        LocationImport previous = importRepository.findById("lgd").orElse(null);
        if (!forceImport && previous != null && previous.getChecksum().equals(checksum)
                && previous.getRowCount() == existingRows && existingRows > 0) {
            log.info("LGD dataset is unchanged; using {} imported locations", existingRows);
            return;
        }

        // Replace only reference locations, atomically. Patient and visit data are untouched.
        locationRepository.deleteAllInBatch();
        importCsv(csvPath);
        if (!checksum.equals(checksum(csvPath))) {
            throw new IOException("Location CSV changed during import; retry with a stable file");
        }
        importRepository.save(new LocationImport(checksum, locationRepository.count()));
    }

    private String checksum(Path path) throws IOException {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (DigestInputStream input = new DigestInputStream(Files.newInputStream(path), digest)) {
                input.transferTo(OutputStream.nullOutputStream());
            }
            return HexFormat.of().formatHex(digest.digest());
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private void importCsv(Path csvPath) throws IOException {
        log.info("Importing LGD locations from {}", csvPath);

        try (BufferedReader reader = Files.newBufferedReader(csvPath, StandardCharsets.UTF_8)) {
            String headerLine = reader.readLine();
            if (headerLine == null) {
                throw new IOException("Location CSV is empty: " + csvPath);
            }

            Map<String, Integer> headers = buildHeaderIndex(parseCsvLine(headerLine));
            List<Location> batch = new ArrayList<>(BATCH_SIZE);
            long imported = 0;
            String line;
            long lineNumber = 1;

            while ((line = reader.readLine()) != null) {
                lineNumber++;
                if (line.isBlank()) continue;
                List<String> columns = parseCsvLine(line);
                Location location = toLocation(headers, columns);
                if (location == null) {
                    throw new IOException("Missing or invalid location fields at CSV line " + lineNumber);
                }

                batch.add(location);
                if (batch.size() == BATCH_SIZE) {
                    saveBatch(batch);
                    imported += batch.size();
                    batch.clear();
                    if (imported % 50000 == 0) log.info("Imported {} LGD rows so far", imported);
                }
            }

            if (!batch.isEmpty()) {
                saveBatch(batch);
                imported += batch.size();
            }

            if (imported == 0) throw new IOException("Location CSV contains no valid locations");
            log.info("Imported {} LGD location rows", imported);
        }
    }

    private void saveBatch(List<Location> locations) {
        jdbcTemplate.batchUpdate(
                INSERT_SQL,
                locations,
                locations.size(),
                (statement, location) -> {
                    statement.setInt(1, location.getStateCode());
                    statement.setString(2, location.getStateName());
                    statement.setInt(3, location.getDistrictCode());
                    statement.setString(4, location.getDistrictName());
                    statement.setInt(5, location.getSubDistrictCode());
                    statement.setString(6, location.getSubDistrictName());
                    statement.setInt(7, location.getVillageCode());
                    statement.setString(8, location.getVillageName());
                }
        );
    }

    private Location toLocation(Map<String, Integer> headers, List<String> columns) {
        Integer stateCode = parseInteger(column(headers, columns, "statecode"));
        String stateName = column(headers, columns, "statename", "statenameenglish", "statenameinenglish");
        Integer districtCode = parseInteger(column(headers, columns, "districtcode"));
        String districtName = column(headers, columns, "districtname", "districtnameenglish", "districtnameinenglish");
        Integer subDistrictCode = parseInteger(column(headers, columns, "subdistrictcode"));
        String subDistrictName = column(
                headers,
                columns,
                "subdistrictname",
                "subdistrictnameenglish",
                "subdistrictnameinenglish"
        );
        Integer villageCode = parseInteger(column(headers, columns, "villagecode"));
        String villageName = column(headers, columns, "villagename", "villagenameenglish", "villagenameinenglish");

        if (
                stateCode == null
                        || stateName == null
                        || districtCode == null
                        || districtName == null
                        || subDistrictCode == null
                        || subDistrictName == null
                        || villageCode == null
                        || villageName == null
        ) {
            return null;
        }

        return new Location(
                stateCode,
                stateName,
                districtCode,
                districtName,
                subDistrictCode,
                subDistrictName,
                villageCode,
                villageName
        );
    }

    private Map<String, Integer> buildHeaderIndex(List<String> headers) {
        Map<String, Integer> index = new HashMap<>();
        for (int i = 0; i < headers.size(); i++) {
            index.put(normalize(headers.get(i)), i);
        }
        return index;
    }

    private String column(Map<String, Integer> headers, List<String> columns, String... names) {
        for (String name : names) {
            Integer index = headers.get(name);
            if (index == null || index >= columns.size()) {
                continue;
            }
            String value = trimNullable(columns.get(index));
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private Integer parseInteger(String value) {
        String trimmed = trimNullable(value);
        if (trimmed == null) {
            return null;
        }
        try {
            return Integer.valueOf(trimmed);
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private String normalize(String value) {
        String text = value == null ? "" : value.replace("\uFEFF", "");
        return text.toLowerCase().replaceAll("[^a-z0-9]", "");
    }

    private String trimNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private List<String> parseCsvLine(String line) {
        List<String> values = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean quoted = false;

        for (int i = 0; i < line.length(); i++) {
            char ch = line.charAt(i);

            if (ch == '"') {
                if (quoted && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    quoted = !quoted;
                }
            } else if (ch == ',' && !quoted) {
                values.add(current.toString());
                current.setLength(0);
            } else {
                current.append(ch);
            }
        }

        values.add(current.toString());
        return values;
    }
}
