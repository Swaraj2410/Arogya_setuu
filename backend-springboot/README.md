# Arogya Rural Spring Boot Backend

This is the Java Spring Boot backend for Arogya Rural.

## Technology Stack

- Java 17+
- Spring Boot 3.x
- Maven
- Spring MVC / Spring Web
- Spring Data JPA
- Hibernate
- MySQL
- Spring Security
- JWT authentication
- Bean Validation
- BCrypt password hashing
- JUnit / Spring Boot Test

## Architecture

React acts as the view layer and calls this backend through HTTP/JSON.

Request flow:

React
-> Controller
-> Request DTO
-> Service
-> Repository
-> Spring Data JPA
-> Hibernate
-> MySQL

Response flow:

MySQL
-> Hibernate
-> Repository
-> Service
-> Response DTO
-> Controller
-> JSON
-> React

Hibernate is the JPA implementation used by Spring Data JPA.

## Folder Structure

```text
src/main/java/com/arogya/rural
  controller/   REST endpoints
  dto/request/  incoming JSON request classes
  dto/response/ outgoing JSON response classes
  entity/       JPA database entities
  enums/        Role and appointment status values
  exception/    centralized API error handling
  mapper/       entity-to-DTO response mapping
  repository/   Spring Data JPA repositories
  security/     Spring Security and JWT code
  service/      business logic
```

## Environment Variables

Create real environment variables or use your IDE run configuration.

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=arogya_rural
DB_USERNAME=root
DB_PASSWORD=
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRATION_MS=604800000
SERVER_PORT=5001
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000
```

See `.env.example` for the same list.

## MySQL Setup

Create the database if it does not already exist:

```sql
CREATE DATABASE arogya_rural;
```

The default config uses:

```properties
spring.jpa.hibernate.ddl-auto=update
```

This lets Hibernate create/update tables during local development. Do not hardcode database passwords or JWT secrets in source files.

## Run

From this directory:

```bash
mvn spring-boot:run
```

The backend runs on:

```text
http://localhost:5001
```

The existing React frontend already points to:

```text
http://localhost:5001/api
```

## Test

```bash
mvn test
```

Tests use H2 in MySQL compatibility mode through `application-test.properties`.

## Important APIs

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/doctors`
- `GET /api/locations/states`
- `GET /api/locations/districts?stateCode=27`
- `GET /api/locations/talukas?districtCode=507`
- `GET /api/locations/villages?talukaCode=4184`
- `GET /api/availability`
- `POST /api/availability`
- `DELETE /api/availability/{id}`
- `GET /api/appointments`
- `POST /api/appointments`
- `PATCH /api/appointments/{id}`
- `DELETE /api/appointments/{id}`
- `GET /api/records`
- `POST /api/records`
- `PATCH /api/records/{id}`
- `GET /api/prescriptions`
- `POST /api/prescriptions`
- `GET /api/notifications`
- `PATCH /api/notifications/{id}/read`
- `GET /api/reports/summary`
- `GET /health`

## Authentication

Register/login returns:

```json
{
  "token": "jwt-token",
  "user": {
    "id": 1,
    "name": "Ananya Sharma",
    "email": "ananya.sharma@example.com",
    "role": "patient",
    "patientId": 1,
    "doctorId": null
  }
}
```

The frontend sends:

```text
Authorization: Bearer <token>
```

The JWT stores the authenticated user id and role. Services use the authenticated user from Spring Security instead of trusting frontend user IDs for patient/doctor-scoped operations.

## Roles

- `patient`: browse doctors, view matching village schedules, book/cancel own appointments, view own records/prescriptions/notifications.
- `doctor`: manage own village availability, view own appointments, create records, create prescriptions, complete appointments.
- `admin`: query all records/appointments and access report summary APIs.

## Village-Wise Scheduling

Doctor availability keeps the rural location fields:

- state
- district
- taluka
- village
- availableDate
- startTime
- endTime

Patients can filter `/api/availability` by their location so they see doctors visiting their village. This preserves the original dynamic village scheduling behavior instead of converting it into a fixed hospital timetable.

## Full India Location Dropdown Data

The patient registration and doctor availability forms use `/api/locations/*` for cascading dropdowns:

state -> district -> taluka/sub-district -> village

For complete India coverage, import the LGD village CSV into MySQL. The importer expects one CSV with these columns:

```text
state_code,state_name,district_code,district_name,sub-district_code,sub-district_name,village_code,village_name
```

The official source is Local Government Directory (LGD), Ministry of Panchayati Raj. Data.gov.in also lists LGD datasets, and compiled 2026 LGD mirrors may provide the same hierarchy as a single CSV.

Beginner import steps:

1. Download/export the complete LGD states, districts, sub-districts, and villages CSV.
2. Put it outside git, for example:

```text
/Users/shwet/Downloads/lgd_locations.csv
```

3. In `src/main/resources/application-local.properties`, set:

```properties
app.locations.import-csv=/Users/shwet/Downloads/lgd_locations.csv
app.locations.force-import=false
```

4. Start the backend:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

5. After the import finishes once, either keep `force-import=false` or comment out `app.locations.import-csv`. If you want to replace the location table with a newer LGD CSV later, set:

```properties
app.locations.force-import=true
```

Then run the backend once and set it back to `false`.

## Appointment Booking Flow

React
-> `POST /api/appointments`
-> `DispatcherServlet`
-> `AppointmentController`
-> `CreateAppointmentRequest`
-> `AppointmentService`
-> `AppointmentRepository`
-> Hibernate
-> MySQL
-> `AppointmentResponse`
-> React
