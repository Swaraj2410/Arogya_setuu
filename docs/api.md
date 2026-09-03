# API Reference

Base path: `/api`

All routes except `POST /auth/register` and `POST /auth/login` require a bearer token.

```http
Authorization: Bearer <jwt>
```

## Auth

### `POST /auth/register`

Registers a user as `patient`, `doctor`, or `admin`.

Patient payload:

```json
{
  "name": "Patient Name",
  "email": "patient@example.com",
  "password": "password",
  "role": "patient",
  "age": 32,
  "gender": "Female",
  "phone": "9876543210",
  "address": "Pune",
  "bloodGroup": "A+",
  "state": "Maharashtra",
  "district": "Gondia",
  "taluka": "Tirora",
  "village": "Mundikota"
}
```

Doctor payload:

```json
{
  "name": "Doctor Name",
  "email": "doctor@example.com",
  "password": "password",
  "role": "doctor",
  "specializationId": 1,
  "qualification": "MBBS, MD",
  "experienceYears": 8,
  "consultationFee": 1000
}
```

Response:

```json
{
  "token": "jwt-token",
  "user": {
    "id": 1,
    "name": "Patient Name",
    "email": "patient@example.com",
    "role": "patient",
    "patientId": 1
  }
}
```

### `POST /auth/login`

Logs in a user and returns a JWT token plus public profile.

```json
{
  "email": "patient@example.com",
  "password": "password"
}
```

### `GET /auth/me`

Returns the authenticated user's public profile.

## Doctors

### `GET /doctors`

Lists doctors from the database with linked user and specialization details.

Optional query:

```text
?specialization=1
```

## AI Triage

### `POST /ai/triage`

Patient-only endpoint. The frontend sends symptoms to Spring Boot; Spring Boot sends the symptoms plus actual
database specialization names to the FastAPI AI service.

Request:

```json
{
  "symptoms": "I have a skin rash and severe itching",
  "language": "en"
}
```

Response:

```json
{
  "assessment": {
    "urgency": "MEDIUM",
    "recommendedSpecialization": "Dermatology",
    "reason": "Persistent rash and itching should be evaluated by a skin specialist.",
    "recommendation": "Book a consultation with a dermatologist.",
    "warningSigns": []
  },
  "doctors": []
}
```

Spring Boot rejects invented AI specialization names by falling back to an existing specialization before doctor lookup.
If FastAPI or Gemini is unavailable, the endpoint returns a `503` JSON error with a user-friendly message.
`language` is optional and supports `en`, `hi`, and `mr`. Human-facing response text follows that language when possible;
`recommendedSpecialization` remains an English database specialization name.

## AI Clinical Note Draft

### `POST /ai/clinical-notes/generate`

Doctor-only endpoint. Spring Boot verifies the authenticated user is a doctor and forwards only rough consultation notes
to FastAPI. This endpoint returns a draft only; it does not create medical records, prescriptions, or complete visits.

Request:

```json
{
  "roughNotes": "patient fever dry cough and body pain for 3 days. viral fever. advised rest and hydration. paracetamol 500 mg twice daily after food for 5 days. follow up after 5 days"
}
```

Response:

```json
{
  "diagnosis": "Viral fever",
  "treatment": "Rest and hydration",
  "medicines": "Paracetamol 500 mg",
  "dosageInstructions": "Twice daily after food for 5 days",
  "notes": "Patient reported fever, dry cough and body pain for 3 days. Follow-up advised after 5 days."
}
```

Rules:

- React calls Spring Boot, not FastAPI or Gemini.
- Missing information is returned as an empty string.
- The AI is instructed not to infer diagnosis, dosage, medication, duration, treatment, symptoms, or advice.
- Doctors must explicitly apply the draft to the Complete Visit form and can edit it before saving.
- If FastAPI, Gemini, or structured output validation fails, Spring Boot returns a `503` JSON error.

## AI Prescription OCR Draft

### `POST /ai/prescriptions/extract`

Doctor-only multipart endpoint. Spring Boot validates the uploaded PNG/JPG image, forwards it to FastAPI, and returns a
draft only. It does not create a prescription or medical record.

Request:

```http
Content-Type: multipart/form-data

file=<prescription.png>
```

Response:

```json
{
  "rawText": "Paracetamol 500 mg twice daily after food for 5 days",
  "medicines": [
    {
      "name": "Paracetamol",
      "dosage": "500 mg",
      "frequency": "twice daily",
      "duration": "5 days",
      "instructions": "after food"
    }
  ],
  "additionalInstructions": "",
  "verificationRequired": true,
  "qualityWarning": "Doctor must verify all OCR-extracted fields before saving."
}
```

Rules:

- Accepted image types are PNG and JPG/JPEG.
- OCR runs locally through Tesseract in the FastAPI service.
- Gemini structures only the OCR-readable text and is instructed not to invent missing medicines or dosage details.
- The doctor must explicitly apply and edit the draft in the Complete Visit prescription form before saving.

## AI Voice Transcription

### `POST /ai/voice/transcribe`

Patient-only multipart endpoint. The browser records audio, Spring Boot validates the upload, and FastAPI transcribes it
locally with `faster-whisper`.

Request:

```http
Content-Type: multipart/form-data

language=en
file=<symptoms.webm>
```

Response:

```json
{
  "text": "I have fever and body pain for three days",
  "language": "en"
}
```

Rules:

- Supported languages are `en`, `hi`, and `mr`.
- The transcript is placed into the symptoms field for patient review before triage.
- Optional browser speech synthesis can read the triage response aloud; it is not a backend dependency.

## AI Follow-Up Reminders

### `POST /ai/follow-up/analyze`

Doctor-only endpoint. Spring Boot verifies the doctor-patient relationship, sends consultation notes to FastAPI, and
calculates the suggested date itself from explicit AI-extracted timing.

Request:

```json
{
  "patientId": 1,
  "visitDate": "2026-09-02",
  "consultationNotes": "Diagnosis: Viral fever. Treatment: Rest and fluids. Follow up after 5 days."
}
```

Response:

```json
{
  "followUpRequired": true,
  "afterDays": 5,
  "followUpDateText": "after 5 days",
  "suggestedDate": "2026-09-07",
  "reason": "Follow-up was explicitly advised in the notes.",
  "reminderMessage": "Please attend your follow-up visit on 2026-09-07.",
  "requiresReview": false,
  "reviewReason": ""
}
```

### `POST /ai/follow-up/reminders`

Doctor-only endpoint that creates the actual patient notification after doctor confirmation.

Request:

```json
{
  "patientId": 1,
  "followUpDate": "2026-09-07",
  "reason": "Follow-up was explicitly advised in the notes.",
  "reminderMessage": "Please attend your follow-up visit on 2026-09-07."
}
```

Rules:

- Gemini never creates notifications directly.
- Spring Boot rejects unauthorized doctor-patient pairs.
- Spring Boot rejects past reminder dates.
- The notification uses the existing notification table and patient notification screen.

## AI Medical Record Q&A

### `POST /ai/medical-records/{patientId}/ask`

Doctor-only endpoint. Spring Boot verifies the authenticated doctor and checks an existing relationship with the patient
before sending any medical record text to FastAPI.

Request:

```json
{
  "question": "What medications was this patient prescribed recently?"
}
```

Response:

```json
{
  "answer": "The patient was prescribed Paracetamol 500mg twice daily for 5 days.",
  "sources": [
    {
      "recordType": "PRESCRIPTION",
      "recordId": 14,
      "date": "2026-08-12"
    }
  ],
  "retrievedChunks": 3
}
```

Rules:

- FastAPI does not query MySQL.
- Spring Boot sends only authorized medical record and prescription chunks.
- Sources refer to existing medical record or prescription ids.
- If the answer is missing from the records, the answer states that the information is not available in the patient's
  medical records.
- If FastAPI, embeddings, FAISS, or Gemini fails, Spring Boot returns a `503` JSON error.

## Locations

### `GET /locations/states`

Lists imported states for the cascading location dropdowns.

### `GET /locations/districts`

```text
?stateCode=27
```

### `GET /locations/talukas`

```text
?districtCode=507
```

### `GET /locations/villages`

```text
?talukaCode=4184
```

## Availability

### `GET /availability`

Lists doctor availability slots.

Optional query:

```text
?doctorId=1&date=2030-04-02&state=Maharashtra&district=Gondia&taluka=Tirora&village=Mundikota
```

Response includes `isBooked` so the frontend can show only open slots for booking.

### `POST /availability`

Creates a doctor availability slot. Doctors can create only their own slots.

```json
{
  "doctorId": 1,
  "availableDate": "2030-04-02",
  "startTime": "10:30",
  "endTime": "11:00",
  "state": "Maharashtra",
  "district": "Gondia",
  "taluka": "Tirora",
  "village": "Mundikota"
}
```

### `DELETE /availability/{id}`

Deletes an open availability slot. A booked slot cannot be deleted.

## Appointments

### `GET /appointments`

Lists appointments scoped by role.

- Patients receive only their own appointments.
- Doctors receive only appointments assigned to them.
- Admins can filter by doctor or patient.

Optional query:

```text
?status=booked&date=2030-04-02&doctorId=1&patientId=1
```

### `POST /appointments`

Books an appointment using a real doctor availability slot.

```json
{
  "patientId": 1,
  "doctorId": 1,
  "appointmentDate": "2030-04-02",
  "appointmentTime": "10:30",
  "reason": "General consultation"
}
```

Backend validation:

- authenticated user required,
- patients can book only for themselves,
- doctor and patient must exist,
- selected slot must exist in `doctor_availability`,
- slot must not already have a booked appointment,
- appointment date cannot be in the past.

### `PATCH /appointments/{id}`

Updates appointment status, date, time, or reason.

Reschedule payload:

```json
{
  "appointmentDate": "2030-04-03",
  "appointmentTime": "11:30"
}
```

Cancel payload:

```json
{
  "status": "cancelled"
}
```

Complete payload:

```json
{
  "status": "completed"
}
```

Allowed statuses:

- `booked`
- `completed`
- `cancelled`

### `DELETE /appointments/{id}`

Deletes an appointment from the database. Patients can delete only their own appointments. Deleted
appointments no longer appear on the patient page or doctor dashboard.

## Medical Records

### `GET /records`

Lists medical records scoped by role.

Optional query:

```text
?patientId=1&doctorId=1&date=2030-04-02&q=fever
```

Response includes linked prescriptions, doctor, and patient details.

### `POST /records`

Creates a medical record. Patients cannot create records.

```json
{
  "patientId": 1,
  "doctorId": 1,
  "diagnosis": "Routine follow-up",
  "treatment": "Continue medication",
  "notes": "Review in two weeks",
  "visitDate": "2030-04-02"
}
```

### `PATCH /records/{id}`

Updates diagnosis, treatment, notes, or visit date.

## Prescriptions

### `GET /prescriptions`

Lists prescriptions scoped by role.

Optional query:

```text
?recordId=1&patientId=1&doctorId=1
```

### `POST /prescriptions`

Creates a prescription linked to a medical record.

```json
{
  "medicalRecordId": 1,
  "patientId": 1,
  "doctorId": 1,
  "medicines": "Paracetamol 500mg",
  "dosageInstructions": "One tablet after food"
}
```

The backend verifies that the prescription patient and doctor match the selected medical record.

## Notifications

### `GET /notifications`

Lists notifications for the authenticated user.

### `PATCH /notifications/{id}/read`

Marks a notification as read.

## Reports

### `GET /reports/summary`

Admin-only summary report.

Optional query:

```text
?from=2030-04-01&to=2030-04-30
```

Response includes appointment status counts and doctor counts by specialization.

## Security Rules

- Spring Security and the JWT filter protect all operational routes.
- Passwords are hashed with BCrypt.
- Patients can access only their own appointments, records, prescriptions, and notifications.
- Doctors can access only their own appointment and record data.
- Patients cannot create medical records or prescriptions.
- Doctors cannot book patient appointments from the patient booking endpoint.
- Appointment booking and rescheduling require valid doctor availability slots.
