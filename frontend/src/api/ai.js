import api from './client';

export const analyzeSymptoms = async (payload) => {
  const { data } = await api.post('/ai/triage', payload);
  return data;
};

export const askMedicalRecords = async (patientId, payload) => {
  const { data } = await api.post(`/ai/medical-records/${patientId}/ask`, payload);
  return data;
};

export const generateClinicalNoteDraft = async (payload) => {
  const { data } = await api.post('/ai/clinical-notes/generate', payload);
  return data;
};

export const extractPrescriptionDraft = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/ai/prescriptions/extract', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};

export const transcribeVoice = async (audioBlob, language) => {
  const formData = new FormData();
  formData.append('file', audioBlob, 'symptoms.webm');
  if (language) {
    formData.append('language', language);
  }
  const { data } = await api.post('/ai/voice/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};

export const analyzeFollowUp = async (payload) => {
  const { data } = await api.post('/ai/follow-up/analyze', payload);
  return data;
};

export const createFollowUpReminder = async (payload) => {
  const { data } = await api.post('/ai/follow-up/reminders', payload);
  return data;
};
