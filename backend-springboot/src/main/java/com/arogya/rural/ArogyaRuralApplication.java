package com.arogya.rural;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.net.URI;

@SpringBootApplication
public class ArogyaRuralApplication {

    public static void main(String[] args) {
        configureRenderDatabaseUrl();
        SpringApplication.run(ArogyaRuralApplication.class, args);
    }

    private static void configureRenderDatabaseUrl() {
        String databaseUrl = System.getenv("DATABASE_URL");
        if (databaseUrl == null || databaseUrl.isBlank() || databaseUrl.startsWith("jdbc:")) {
            return;
        }
        if (databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://")) {
            URI uri = URI.create(databaseUrl.replaceFirst("^postgres://", "postgresql://"));
            StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://")
                    .append(uri.getHost())
                    .append(':')
                    .append(uri.getPort() > 0 ? uri.getPort() : 5432)
                    .append(uri.getRawPath());
            if (uri.getRawQuery() != null && !uri.getRawQuery().isBlank()) {
                jdbcUrl.append('?').append(uri.getRawQuery());
            }
            System.setProperty("spring.datasource.url", jdbcUrl.toString());
        }
    }
}
