import React from 'react';
import { FileText, Pill, Printer, Sparkles } from 'lucide-react';
import Badge from './Badge';
import Button from './Button';
import Card from './Card';
import { formatDate, getDoctorName, getPatientName } from '../utils/formatters';

export const printPrescription = (prescription) => {
  const win = window.open('', '_blank', 'width=720,height=900');
  if (!win) return;
  const escapeHtml = (value) =>
    String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');

  win.document.write(`
    <html>
      <head>
        <title>Arogya Rural Prescription</title>
        <style>
          body { font-family: Arial, sans-serif; color: #14211e; padding: 32px; }
          h1 { margin: 0 0 8px; font-size: 24px; }
          .muted { color: #64748b; }
          .box { border: 1px solid #dbe3df; border-radius: 8px; padding: 16px; margin-top: 16px; }
          .label { font-weight: 700; }
        </style>
      </head>
      <body>
        <h1>Arogya Rural Prescription</h1>
        <p class="muted">Digital prescription document</p>
        <div class="box">
          <p><span class="label">Doctor:</span> ${escapeHtml(getDoctorName(prescription.Doctor))}</p>
          <p><span class="label">Patient:</span> ${escapeHtml(getPatientName(prescription.Patient))}</p>
          <p><span class="label">Visit:</span> ${escapeHtml(prescription.MedicalRecord?.visitDate || '')}</p>
        </div>
        <div class="box">
          <p><span class="label">Medicines:</span> ${escapeHtml(prescription.medicines)}</p>
          <p><span class="label">Dosage:</span> ${escapeHtml(prescription.dosageInstructions)}</p>
        </div>
      </body>
    </html>
  `);
  win.document.close();
  win.print();
};

export default function PrescriptionCard({ prescription }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-semibold text-slate-950">
            <Pill size={18} className="text-brand-700" aria-hidden="true" />
            Prescription #{prescription.id}
          </p>
          <p className="mt-1 text-sm text-slate-600">{getDoctorName(prescription.Doctor)}</p>
          <p className="text-sm text-slate-600">{getPatientName(prescription.Patient)}</p>
        </div>
        <Badge label="Digital" variant="subtle" />
      </div>
      <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-semibold text-slate-800">Medicines</p>
        <p className="mt-1 text-sm leading-6 text-slate-700">{prescription.medicines}</p>
        <p className="mt-3 text-sm font-semibold text-slate-800">Dosage instructions</p>
        <p className="mt-1 text-sm leading-6 text-slate-700">{prescription.dosageInstructions}</p>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
        <span className="inline-flex items-center gap-1">
          <FileText size={15} aria-hidden="true" />
          Visit {formatDate(prescription.MedicalRecord?.visitDate)}
        </span>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" icon={Printer} onClick={() => printPrescription(prescription)}>
            Print
          </Button>
          <Button variant="secondary" size="sm" icon={Sparkles} disabled title="Future AI feature">
            Explain simply
          </Button>
        </div>
      </div>
    </Card>
  );
}
