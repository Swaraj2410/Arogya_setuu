# Arogya Rural AI Service

FastAPI microservice for Arogya Rural AI features:

- AI Symptom Triage + Doctor Recommendation
- RAG-Based Medical Record Q&A for doctors
- AI Clinical Note Generator / Clinical Documentation Assistant
- Prescription OCR Digitizer for doctors
- Multilingual Voice Assistant for patients
- Smart Follow-Up Analyzer for doctors

The production flow is:

```text
React -> Spring Boot -> FastAPI -> Gemini
FastAPI -> Spring Boot -> MySQL doctor lookup -> React
```

React must not call this service or Gemini directly. Spring Boot remains the security and database gatekeeper.

## Setup

```bash
cd ai-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Set `GEMINI_API_KEY` in `.env`. `GEMINI_MODEL` defaults to `gemini-3.7-flash` and can be changed without code edits.
The RAG assistant uses local SentenceTransformers embeddings. `RAG_EMBEDDING_MODEL` defaults to
`sentence-transformers/all-MiniLM-L6-v2`.
Prescription OCR uses local Tesseract through `pytesseract`, so install the system binary separately before using real
image OCR:

```bash
brew install tesseract
```

Voice transcription uses local `faster-whisper`. The first real transcription can download the configured Whisper model
(`VOICE_MODEL=base` by default) unless it is already cached.

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

Health check:

```bash
curl http://localhost:8000/health
```

Triage:

```bash
curl -X POST http://localhost:8000/triage \
  -H 'Content-Type: application/json' \
  -d '{
    "symptoms": "I have severe chest pain and difficulty breathing",
    "allowedSpecializations": ["Cardiology", "Dermatology", "Orthopedics", "General Medicine"],
    "language": "en"
  }'
```

The service returns strict JSON with `urgency`, `recommendedSpecialization`, `reason`, `recommendation`, and `warningSigns`.
`recommendedSpecialization` always stays as an English database specialization name; human-facing text follows the
requested language when supported.

Clinical note draft generation:

```bash
curl -X POST http://localhost:8000/clinical-notes/generate \
  -H 'Content-Type: application/json' \
  -d '{
    "roughNotes": "patient fever dry cough and body pain for 3 days. viral fever. advised rest and hydration. paracetamol 500 mg twice daily after food for 5 days. follow up after 5 days"
  }'
```

The service returns strict JSON with `diagnosis`, `treatment`, `medicines`, `dosageInstructions`, and `notes`.
It formats only facts present in the doctor's rough notes. It does not save records or prescriptions.

Prescription OCR draft extraction:

```bash
curl -X POST http://localhost:8000/prescription-ocr/extract \
  -F 'file=@/path/to/prescription.jpg;type=image/jpeg'
```

FastAPI reads the image locally with Tesseract OCR, then asks Gemini to structure only the readable text into medicine
fields. The response is a draft with `rawText`, `medicines`, `additionalInstructions`, `verificationRequired`, and
`qualityWarning`; it does not save anything.

Voice transcription:

```bash
curl -X POST http://localhost:8000/voice/transcribe \
  -F 'language=en' \
  -F 'file=@/path/to/symptoms.webm;type=audio/webm'
```

The response contains `text` and `language`. Supported languages are English, Hindi, and Marathi.

Follow-up analysis:

```bash
curl -X POST http://localhost:8000/follow-up/analyze \
  -H 'Content-Type: application/json' \
  -d '{
    "consultationNotes": "Diagnosis: Viral fever. Treatment: Rest and fluids. Follow up after 5 days."
  }'
```

Gemini extracts only explicit follow-up instructions. Spring Boot calculates final dates and creates reminders only after
doctor confirmation.

RAG medical record Q&A:

```bash
curl -X POST http://localhost:8000/rag/query \
  -H 'Content-Type: application/json' \
  -d '{
    "patientId": 12,
    "question": "What medicines was this patient prescribed recently?",
    "documents": [
      {
        "id": "medical-record-21",
        "type": "MEDICAL_RECORD",
        "text": "Medical Visit\nMedical Record ID: 21\nVisit Date: 2026-08-12\nDiagnosis: Viral fever\nTreatment: Rest and fluids",
        "metadata": {
          "patientId": 12,
          "medicalRecordId": 21,
          "visitDate": "2026-08-12",
          "recordType": "MEDICAL_RECORD"
        }
      },
      {
        "id": "prescription-14",
        "type": "PRESCRIPTION",
        "text": "Prescription\nPrescription ID: 14\nMedical Record ID: 21\nVisit Date: 2026-08-12\nMedicines: Paracetamol 500mg\nDosage Instructions: Twice daily for 5 days",
        "metadata": {
          "patientId": 12,
          "medicalRecordId": 21,
          "prescriptionId": 14,
          "visitDate": "2026-08-12",
          "recordType": "PRESCRIPTION"
        }
      }
    ]
  }'
```

Spring Boot normally calls `/rag/query`; direct curl is only for local service testing with already-authorized sample data.
FastAPI does not query MySQL.
