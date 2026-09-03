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
AI_SERVICE_BASE_URL=http://localhost:8000
AI_SERVICE_CONNECT_TIMEOUT=2s
AI_SERVICE_READ_TIMEOUT=12s
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
- `POST /api/ai/triage`
- `POST /api/ai/medical-records/{patientId}/ask`
- `POST /api/ai/clinical-notes/generate`
- `POST /api/ai/prescriptions/extract`
- `POST /api/ai/voice/transcribe`
- `POST /api/ai/follow-up/analyze`
- `POST /api/ai/follow-up/reminders`
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

- `patient`: browse doctors, view matching village schedules, book/cancel own appointments, view own records/prescriptions/notifications, use text or voice symptom triage.
- `doctor`: manage own village availability, view own appointments, generate clinical note drafts, digitize prescription images as drafts, analyze follow-up instructions, create records, create prescriptions, complete appointments.
- `admin`: query all records/appointments and access report summary APIs.

## AI Clinical Note Drafting

`POST /api/ai/clinical-notes/generate` is doctor-only and forwards only `roughNotes` to FastAPI. It returns a structured
draft for the existing Complete Visit form:

```json
{
  "diagnosis": "Viral fever",
  "treatment": "Rest and hydration",
  "medicines": "Paracetamol 500 mg",
  "dosageInstructions": "Twice daily after food for 5 days",
  "notes": "Patient reported fever, dry cough and body pain for 3 days. Follow-up advised after 5 days."
}
```

This endpoint does not create medical records, prescriptions, appointments, or any other database rows. The doctor must
apply the draft, review/edit the existing form, and click the normal Complete Visit button to save.

## AI Prescription OCR Drafting

`POST /api/ai/prescriptions/extract` is doctor-only and accepts a PNG or JPG multipart file. Spring Boot validates the
file before forwarding it to FastAPI. FastAPI performs local Tesseract OCR, then Gemini structures the readable text into
draft prescription fields.

The endpoint returns `rawText`, a list of medicine draft rows, `additionalInstructions`, `verificationRequired`, and
`qualityWarning`. It does not create a prescription. The doctor must review the draft, apply it to the existing Complete
Visit prescription fields, edit it if needed, and then use the normal Complete Visit flow to save.

## AI Voice Symptom Triage

`POST /api/ai/voice/transcribe` is patient-only and accepts a short audio upload from the browser recorder. Spring Boot
forwards the audio to FastAPI, where `faster-whisper` transcribes English, Hindi, or Marathi speech locally. The frontend
places the transcript into the existing symptoms box so the patient can edit it before calling `/api/ai/triage`.

The triage endpoint also accepts optional `language` (`en`, `hi`, or `mr`). The AI response text follows that language,
but `recommendedSpecialization` remains an English specialization name so doctor lookup remains database-compatible.

## AI Follow-Up Reminder Drafting

`POST /api/ai/follow-up/analyze` is doctor-only. Spring Boot checks the doctor-patient relationship, sends consultation
notes to FastAPI, and accepts only explicit follow-up instructions. Spring Boot calculates or validates the final date.

`POST /api/ai/follow-up/reminders` creates a patient notification only after the doctor confirms the reviewed date and
message. Gemini never writes to the database and never receives unrestricted database access.

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

## AI Symptom Triage Flow

React sends patient-entered symptoms only to Spring Boot:

```text
POST /api/ai/triage
```

Spring Boot verifies the JWT, allows patient users only, loads the actual specialization names from MySQL, calls the
FastAPI service, validates that the returned specialization exists, and then reuses the existing doctor listing logic.

FastAPI expects `GEMINI_API_KEY` and `GEMINI_MODEL` in its own environment. The frontend never receives the Gemini API
key and never calls FastAPI directly.

## RAG Medical Record Q&A Flow

Doctors can ask grounded questions about patient records through:

```text
POST /api/ai/medical-records/{patientId}/ask
```

Spring Boot verifies the JWT, requires the authenticated user to be a doctor, verifies an existing doctor-patient
relationship through appointments or medical records, fetches only that doctor's records for the requested patient, and
builds record-aware RAG documents from existing `MedicalRecord` and `Prescription` fields.

The FastAPI service receives only those authorized documents, builds an ephemeral FAISS index using local
SentenceTransformers embeddings, retrieves relevant chunks, and asks Gemini for a grounded structured answer.
