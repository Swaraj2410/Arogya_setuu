# Arogya Rural

Rural doctor scheduling and digital health records.

A full-stack healthcare web application for village-based doctor schedule publishing, patient appointment booking,
medical records, prescriptions, notifications, and admin reports.

The project is built as a Software Engineering academic project with real database-backed workflows. The
doctor and patient sections do not depend on dummy data for core operations. Doctors create real availability
slots in the database, patients book from those slots, doctors complete visits by creating medical records and
prescriptions, and patients view those records from the database.

## Project Summary

Arogya Rural solves common rural healthcare workflow problems:

- Patients need a simple way to see doctor visits for their registered village and book valid appointment slots.
- Doctors need to publish village availability and view upcoming visits.
- Hospitals need reliable appointment lifecycle tracking.
- Medical records and prescriptions should be stored digitally and accessed securely.
- Admins need summary reports for hospital activity.
- Patients need preliminary symptom triage that routes them to an existing doctor specialization without exposing
  medical records to an AI provider.
- Doctors need draft clinical documentation support while keeping final medical record saving under doctor review.

The system supports three roles:

- `patient`
- `doctor`
- `admin`

Each role has protected routes, role-specific dashboards, and database-scoped access.

## Quick Start: How to Run the Project

Run the project with three local services:

- Spring Boot backend on `http://localhost:5001`
- FastAPI AI service on `http://localhost:8000`
- React frontend on `http://localhost:5173`

### Prerequisites

- Java 17 or later
- Maven
- Node.js 18 or later
- Python 3.11 or later
- MySQL running locally
- Gemini API key for AI features
- Tesseract OCR for prescription image OCR

Install Tesseract on macOS:

```bash
brew install tesseract
```

### 1. Start MySQL

Create the local database:

```sql
CREATE DATABASE arogya_rural;
```

### 2. Start the AI Service

```bash
cd ai-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `ai-service/.env` and set your Gemini key:

```env
GEMINI_API_KEY=your_real_key_here
GEMINI_MODEL=gemini-3.7-flash
VOICE_MODEL=base
VOICE_DEVICE=cpu
VOICE_COMPUTE_TYPE=int8
```

Run FastAPI:

```bash
uvicorn app.main:app --reload --port 8000
```

Check it:

```bash
curl http://localhost:8000/health
```

### 3. Start the Spring Boot Backend

In a new terminal:

```bash
cd backend-springboot
cp src/main/resources/application-local.properties.example src/main/resources/application-local.properties
```

Edit `src/main/resources/application-local.properties` and set:

```properties
spring.datasource.username=root
spring.datasource.password=your_mysql_password
jwt.secret=change-this-to-a-long-random-local-secret
ai.service.base-url=http://localhost:8000
```

Run Spring Boot:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

Check it:

```bash
curl http://localhost:5001/health
```

### 4. Start the React Frontend

In a third terminal:

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

### Optional Verification Commands

```bash
cd backend-springboot
mvn test
```

```bash
cd frontend
npm run build
```

```bash
cd ai-service
source .venv/bin/activate
python3 -m compileall app
```

## Key Features

### Patient Features

- Patient registration and login.
- Patient registration with state, district, taluka, and village.
- Patient dashboard with upcoming appointments, records, doctors, and village visit schedules.
- Real doctor search by name or specialization.
- Doctor schedule discovery for the patient's registered village.
- Appointment booking using real doctor availability slots.
- Appointment rescheduling using available slots.
- Appointment cancellation.
- Appointment deletion from the database.
- Medical record viewing.
- Prescription viewing inside medical records.
- Printable prescription sheet.
- Patient-scoped notifications.
- AI Symptom Assistant for preliminary triage and doctor-specialization routing.
- Multilingual voice symptom entry in English, Hindi, and Marathi.

### Doctor Features

- Doctor registration and login.
- Doctor dashboard with statistics, upcoming visits, availability, and recent notes.
- Doctor availability slot creation with state, district, taluka, village, date, start time, and end time.
- Doctor availability slot deletion when not booked.
- Upcoming appointment queue.
- Complete visit workflow.
- AI Clinical Note Assistant for draft-only documentation inside the Complete Visit workflow.
- AI Prescription OCR Digitizer for draft-only prescription extraction from PNG/JPG images.
- Smart Follow-Up Agent for explicit follow-up reminder drafts with doctor confirmation.
- Medical record creation from appointment.
- Optional prescription creation during visit completion.
- Completed appointment status update.
- Doctor-scoped appointment and record access.
- Doctor-only RAG Medical Record Assistant for grounded Q&A over authorized records and prescriptions.

### Admin Features

- Admin login.
- Admin dashboard.
- Summary counts for patients, doctors, active appointments, and records.
- Appointment status reports.
- Specialization-wise doctor summaries.
- System-level monitoring view.

## Real Database-Backed Workflows

### Appointment Booking Flow

1. Doctor logs in.
2. Doctor adds availability slots with state, district, taluka, village, date, start time, and end time.
3. Patient logs in.
4. Patient sees schedules for their registered village or selects a doctor and date.
5. System loads only open slots from the database.
6. Patient books one available slot.
7. Backend checks:
   - user authentication,
   - patient ownership,
   - doctor existence,
   - slot availability,
   - duplicate appointment conflict.
8. Appointment is stored with status `booked`.
9. Patient and doctor notifications are created.

### Appointment Reschedule Flow

1. Patient opens the appointments page.
2. Patient clicks reschedule.
3. System loads real open slots for the same doctor.
4. Patient selects a new date and slot.
5. Backend validates availability and conflict rules.
6. Appointment date and time are updated in the database.

### Appointment Cancel/Delete Flow

- Cancel changes appointment status to `cancelled`.
- Delete removes the appointment record from the database.
- Deleted appointments no longer appear in the patient appointment list or doctor dashboard.

### Doctor Visit Completion Flow

1. Doctor opens the dashboard.
2. Doctor selects a booked appointment.
3. Doctor can optionally type rough consultation notes and generate an AI draft.
4. AI draft values are only applied after the doctor clicks Apply to Form.
5. Doctor reviews and edits diagnosis, treatment, notes, visit date, medicines, and dosage instructions.
6. System creates a medical record only when the doctor clicks Complete Visit.
7. System creates a prescription if prescription fields are provided.
8. Appointment status changes to `completed`.
9. Patient can view the record and prescription.

## Tech Stack

### Frontend

- React 18
- Vite 5
- Tailwind CSS 3
- React Router 6
- Axios
- lucide-react icons
- dayjs

### Backend

- Java 17+
- Spring Boot 3.x
- Maven
- Spring MVC / Spring Web
- Spring Data JPA
- Hibernate
- MySQL
- Spring Security
- JWT authentication
- BCrypt password hashing
- JUnit / Spring Boot Test

### AI Service

- Python 3.11+
- FastAPI
- Google Gen AI Python SDK
- SentenceTransformers local embeddings
- FAISS local vector search
- Tesseract OCR through pytesseract
- faster-whisper local speech transcription
- Gemini, configured through environment variables

## Project Structure

```text
Project/
├── backend-springboot/
│   ├── pom.xml
│   ├── src/
│   │   ├── main/java/com/arogya/rural/
│   │   │   ├── config/
│   │   │   ├── controller/
│   │   │   ├── dto/
│   │   │   ├── entity/
│   │   │   ├── exception/
│   │   │   ├── repository/
│   │   │   ├── security/
│   │   │   └── service/
│   │   ├── main/resources/
│   │   └── test/
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── data/
│   │   ├── layouts/
│   │   ├── pages/
│   │   └── state/
│   └── package.json
├── ai-service/
│   ├── app/
│   │   ├── core/
│   │   ├── prompts/
│   │   ├── routes/
│   │   ├── schemas/
│   │   └── services/
│   ├── requirements.txt
│   └── README.md
├── docs/
│   ├── api.md
│   ├── syllabus-alignment.md
│   ├── srs-smart-hospital.docx
│   ├── srs-smart-hospital.html
│   └── srs-smart-hospital.pdf
└── README.md
```

## Main Frontend Pages

- `LandingPage.jsx` - public project landing page.
- `LoginPage.jsx` - user login.
- `RegisterPage.jsx` - patient, doctor, and admin registration.
- `PatientDashboard.jsx` - patient workspace.
- `DoctorDashboard.jsx` - doctor workspace, availability, and visit completion.
- `AdminDashboard.jsx` - admin monitoring dashboard.
- `AppointmentPage.jsx` - booking, listing, rescheduling, cancellation, deletion.
- `MedicalRecordsPage.jsx` - medical records and prescriptions.
- `NotificationsPage.jsx` - user notifications.
- `AIAssistantPage.jsx` - patient AI symptom triage and doctor routing.
- `MedicalRecordsPage.jsx` - doctor RAG medical record Q&A appears in the existing records workflow.
- `DoctorDashboard.jsx` - AI clinical note drafting appears inside the existing Complete Visit workflow.

## Main Backend Modules

- `AuthController.java` - registration, login, current user.
- `DoctorController.java` - doctor listing.
- `LocationController.java` - state, district, taluka, and village dropdown data.
- `AvailabilityController.java` - doctor availability slots.
- `AppointmentController.java` - appointment booking, listing, update, delete.
- `MedicalRecordController.java` - medical record listing, creation, update.
- `PrescriptionController.java` - prescription listing and creation.
- `NotificationController.java` - notification listing and read status.
- `ReportController.java` - admin summary reports.
- `AiTriageController.java` - patient AI symptom triage through the FastAPI service.
- `AiMedicalRecordQaController.java` - doctor-only RAG medical record Q&A through the FastAPI service.
- `AiClinicalNoteController.java` - doctor-only clinical note draft generation through the FastAPI service.
- `AiPrescriptionOcrController.java` - doctor-only prescription OCR draft extraction through the FastAPI service.
- `AiVoiceController.java` - patient-only voice transcription through the FastAPI service.
- `AiFollowUpController.java` - doctor-only follow-up analysis and confirmed reminder creation.

## Database Entities

The JPA entities represent the core hospital domain:

- `User`
- `Patient`
- `Doctor`
- `Specialization`
- `DoctorAvailability`
- `Appointment`
- `MedicalRecord`
- `Prescription`
- `Notification`

Important relationships:

- One `User` can have one `Patient` profile.
- One `User` can have one `Doctor` profile.
- One `Specialization` has many `Doctors`.
- One `Doctor` has many `DoctorAvailability` slots.
- One `Patient` has many `Appointments`.
- One `Doctor` has many `Appointments`.
- One `Patient` has many `MedicalRecords`.
- One `Doctor` has many `MedicalRecords`.
- One `MedicalRecord` has many `Prescriptions`.
- One `User` has many `Notifications`.
- `Patient` stores state, district, taluka, and village.
- `DoctorAvailability` stores the village location for each published schedule.

## API Overview

Base path:

```text
/api
```

### Authentication

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

### Doctors

- `GET /doctors`

### Availability

- `GET /availability`
- `POST /availability`
- `DELETE /availability/{id}`

### Appointments

- `GET /appointments`
- `POST /appointments`
- `PATCH /appointments/{id}`
- `DELETE /appointments/{id}`

### Medical Records

- `GET /records`
- `POST /records`
- `PATCH /records/{id}`

### Prescriptions

- `GET /prescriptions`
- `POST /prescriptions`

### Notifications

- `GET /notifications`
- `PATCH /notifications/{id}/read`

### Reports

- `GET /reports/summary`

### AI

- `POST /ai/triage`
- `POST /ai/medical-records/{patientId}/ask`
- `POST /ai/clinical-notes/generate`
- `POST /ai/prescriptions/extract`
- `POST /ai/voice/transcribe`
- `POST /ai/follow-up/analyze`
- `POST /ai/follow-up/reminders`

See [docs/api.md](docs/api.md) for the API reference.

## Security

- Passwords are hashed using BCrypt.
- JWT tokens are issued after login and registration.
- Protected backend routes use Spring Security and a JWT filter.
- Service-level checks restrict patient, doctor, and admin access.
- Patients can only access their own appointments, records, prescriptions, and notifications.
- Doctors can only access their own appointment queue and records.
- Appointment booking and rescheduling require real availability slots.

## Setup Instructions

### 1. Backend Setup

```bash
cd backend-springboot
```

Create the MySQL database:

```sql
CREATE DATABASE arogya_rural;
```

Create `src/main/resources/application-local.properties` from
`src/main/resources/application-local.properties.example`, then set your MySQL password and JWT secret.

Start the Spring Boot backend:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

The local API runs at:

```text
http://localhost:5001
```

The backend can optionally import LGD state, district, taluka, and village CSV data. See
[backend-springboot/README.md](backend-springboot/README.md) for the import steps.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The local frontend runs at:

```text
http://localhost:5173
```

The frontend API client defaults to:

```text
http://localhost:5001/api
```

You can override it with `frontend/.env`:

```env
VITE_API_URL=http://localhost:5001/api
```

### 3. AI Service Setup

```bash
cd ai-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Set `GEMINI_API_KEY` in `ai-service/.env`, then run:

```bash
uvicorn app.main:app --reload --port 8000
```

Spring Boot calls this service through:

```properties
ai.service.base-url=http://localhost:8000
```

The first RAG request may download the local embedding model:

```properties
RAG_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
RAG_TOP_K=4
```

Install Tesseract for real prescription image OCR:

```bash
brew install tesseract
```

Voice transcription uses local `faster-whisper`. The first real voice request can download the configured Whisper model:

```properties
VOICE_MODEL=base
VOICE_DEVICE=cpu
VOICE_COMPUTE_TYPE=int8
```

The clinical note, prescription OCR, triage, and follow-up analyzers reuse `GEMINI_API_KEY` and `GEMINI_MODEL`. Draft
features do not add database writes; the doctor or patient must explicitly apply, edit, or confirm results in the normal
Spring Boot workflow.

## Creating Users

Use the registration page or `POST /api/auth/register` to create patient, doctor, and admin accounts. Doctors,
patients, slots, appointments, records, and prescriptions are stored in MySQL through the Spring Boot API.

## Testing

Backend tests live in `backend-springboot/src/test/`.

Run tests:

```bash
cd backend-springboot
mvn test
```

Current tested workflows include:

- Login and bad credential rejection.
- Patient registration with rural location validation.
- Patient-scoped appointment listing.
- Appointment booking.
- Location-based doctor availability creation and filtering.
- Registered doctor details in booking response.
- Appointment deletion disappearing from doctor list.
- Doctor completion with medical record and prescription.
- Role-based access prevention.
- Admin report access.
- Notification read status update.
- AI symptom triage service rules.
- Doctor-only medical record RAG authorization and document building.
- Doctor-only clinical note draft validation and response sanitization.
- Doctor-only prescription OCR validation and response sanitization.
- Patient-only voice transcription validation and language handling.
- Doctor-only follow-up analysis, date calculation, authorization, and notification confirmation.

Frontend production build:

```bash
cd frontend
npm run build
```

## Agile Plan

### Sprint 1: Authentication and Foundation

Deliverables:

- React app structure.
- Spring Boot API setup.
- JPA entities and repositories.
- MySQL connection.
- JWT login/register.
- Protected routes.
- Patient, doctor, and admin roles.

### Sprint 2: Appointment Workflow

Deliverables:

- Doctor listing.
- Doctor availability slots.
- Slot-based appointment booking.
- Appointment list filters.
- Appointment reschedule, cancel, and delete.
- Patient and doctor appointment visibility.

### Sprint 3: Medical Records and Prescriptions

Deliverables:

- Doctor visit completion.
- Medical record creation.
- Prescription creation.
- Patient medical record view.
- Prescription print view.

### Sprint 4: Notifications, Reports, and Testing

Deliverables:

- Notifications.
- Admin summary reports.
- LGD location import support.
- JUnit/Spring Boot backend tests.
- SRS and syllabus documentation.

## Software Engineering Syllabus Mapping

The project maps to major Software Engineering syllabus units:

- Unit I: Software Engineering paradigms.
- Unit II: Requirements engineering.
- Unit III: Agile methodology.
- Unit IV: Static and dynamic interaction modeling.
- Unit V: Software architecture design.
- Unit VI: Design patterns.

Full mapping is available in:

- [docs/syllabus-alignment.md](docs/syllabus-alignment.md)

## SRS Documents

The project includes a formal Software Requirement Specification:

- [docs/srs-smart-hospital.docx](docs/srs-smart-hospital.docx)
- [docs/srs-smart-hospital.pdf](docs/srs-smart-hospital.pdf)
- [docs/srs-smart-hospital.html](docs/srs-smart-hospital.html)

The SRS includes:

- Abstract.
- Introduction.
- Problem statement.
- System overview.
- Requirement engineering methodology.
- Functional requirements.
- Non-functional requirements.
- Constraints.
- Hardware and software requirements.
- Conclusion.

## Architecture

The system follows a layered client-server architecture.

```text
Browser
  ↓
React Frontend
  ↓
Axios API Clients
  ↓
Spring MVC Controllers
  ↓
Spring Security JWT Filter
  ↓
Services
  ↓
Spring Data JPA Repositories
  ↓
Hibernate
  ↓
MySQL Database
```

AI triage uses a separate service while preserving Spring Boot as the security and business-logic layer:

```text
React -> Spring Boot -> FastAPI -> Gemini
FastAPI -> Spring Boot -> MySQL doctor lookup -> React
```

Doctor medical-record Q&A uses local retrieval before Gemini:

```text
React -> Spring Boot -> JWT + doctor authorization -> MySQL authorized records
Spring Boot -> FastAPI -> SentenceTransformers -> FAISS -> retrieved chunks -> Gemini
Gemini -> FastAPI -> Spring Boot -> React
```

Doctor clinical-note drafting uses Gemini structured output without changing the save workflow:

```text
Doctor -> React -> Spring Boot JWT + doctor check -> FastAPI -> Gemini structured draft
Spring Boot -> React preview -> doctor applies/edits -> existing Complete Visit API -> MySQL
```

Prescription OCR uses local OCR before Gemini and remains draft-only:

```text
Doctor -> React image upload -> Spring Boot JWT + file validation -> FastAPI -> Tesseract OCR -> Gemini structured draft
Spring Boot -> React preview -> doctor applies/edits -> existing Complete Visit API -> MySQL
```

Voice triage transcribes locally before reusing the existing triage flow:

```text
Patient -> React MediaRecorder -> Spring Boot JWT + audio validation -> FastAPI -> faster-whisper transcript
React editable symptoms -> Spring Boot triage -> FastAPI -> Gemini -> Spring doctor lookup -> React
```

Follow-up reminders are human-confirmed notifications:

```text
Doctor -> React Complete Visit notes -> Spring Boot authorization -> FastAPI -> Gemini follow-up extraction
Spring Boot date calculation -> React doctor review -> Spring Boot creates Notification -> MySQL
```

Architecture qualities:

- Modular frontend pages and reusable components.
- Centralized API clients.
- Separated backend controllers, services, repositories, security, and entities.
- Role-based access control.
- Relational database persistence.
- Automated Spring Boot service tests.

## Design Patterns Used

- MVC-style architecture: React views, Spring MVC controllers, JPA entities.
- Facade: frontend API modules hide Axios details.
- Adapter: API client adapts Axios and token storage.
- Chain of Responsibility: Spring Security filter chain.
- Repository: Spring Data JPA repositories encapsulate persistence operations.
- DTO mapper: response mapper separates entity persistence from API response shape.

## Suggested PPT Structure

Use this slide order for presentation:

1. Title Slide
   - Project name
   - Team members
   - Guide/department details

2. Problem Statement
   - Manual scheduling issues
   - Record access problems
   - Need for role-based hospital system

3. Objectives
   - Real slot-based appointment booking
   - Digital medical records
   - Doctor availability management
   - Secure patient/doctor/admin access

4. System Users
   - Patient
   - Doctor
   - Admin

5. Tech Stack
   - React, Tailwind, Spring Boot, Spring Data JPA, Hibernate, MySQL, JWT

6. System Architecture
   - Browser to React to Spring Boot to Hibernate to MySQL

7. Database Design
   - User, Patient, Doctor, Specialization, Availability, Appointment, Record, Prescription, Notification

8. Patient Module
   - Book, reschedule, cancel, delete appointments
   - View records and prescriptions

9. Doctor Module
   - Add availability
   - View appointments
   - Complete visit
   - Create record and prescription

10. Admin Module
    - Dashboard
    - Reports
    - Monitoring

11. Key Workflows
    - Booking workflow
    - Doctor visit completion workflow

12. Security
    - JWT
    - bcrypt
    - Role-based access
    - Data scoping

13. Testing
    - JUnit and Spring Boot Test
    - Tested workflows

14. Output Screens
    - Login/Register
    - Patient dashboard
    - Appointment page
    - Doctor dashboard
    - Medical records
    - Admin dashboard

15. Conclusion and Future Scope
    - Current achievements
    - Payment, video consultation, lab integration, analytics

## Suggested Report Structure

Use this order for a written report:

1. Cover page
2. Certificate or declaration
3. Acknowledgement
4. Abstract
5. Introduction
6. Problem statement
7. Objectives
8. Scope
9. Requirement analysis
10. Functional requirements
11. Non-functional requirements
12. System design
13. Architecture diagram
14. Database design
15. Module description
16. Implementation details
17. Testing
18. Result screenshots
19. Conclusion
20. Future scope
21. References

## Suggested Screenshots for PPT and Report

Capture these screens:

- Landing page.
- Login page.
- Registration page with role selection.
- Patient dashboard.
- Appointment booking with real slots.
- Appointment reschedule/cancel/delete actions.
- Doctor dashboard.
- Doctor availability form.
- Doctor complete visit form.
- AI clinical note draft preview inside Complete Visit.
- Medical records page with prescription.
- Doctor medical record Q&A assistant.
- Admin dashboard.
- Backend test output.

## Future Scope

- Payment gateway for consultation fees.
- Video consultation.
- Lab test integration.
- Insurance claim processing.
- File upload for reports and prescriptions.
- SMS/email reminders.
- Doctor rating and feedback.
- Advanced admin analytics.
- Audit logs for medical record access.
- Deployment with HTTPS and production database backups.

## Viva Points

- The project is not only CRUD; it has real role-based workflows.
- Patients book only real doctor availability slots from the database.
- Doctors can complete appointments and create linked records and prescriptions.
- Deleting an appointment removes it from both patient and doctor views because it is deleted from the database.
- JWT and bcrypt secure authentication.
- Patient privacy is enforced through backend query scoping.
- The architecture is layered and maintainable.
- The project includes SRS, syllabus alignment, API documentation, and automated tests.
