import React from 'react';
import { ClipboardCheck, FileText, Printer, Stethoscope, UserRound } from 'lucide-react';
import Button from './Button';
import Card from './Card';
import Badge from './Badge';
import { formatDate, getDoctorName, getPatientName } from '../utils/formatters';

const prescriptions = (record) => record.Prescriptions || record.prescriptions || [];

const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const printRecordPrescription = (record) => {
  const items = prescriptions(record);
  const win = window.open('', '_blank', 'width=720,height=900');
  if (!win) return;
  win.document.write(`
    <html>
      <head>
        <title>Arogya Rural Record #${record.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #14211e; }
          h1 { font-size: 24px; margin: 0 0 8px; }
          .muted { color: #64748b; }
          .block { border: 1px solid #dbe3df; border-radius: 8px; padding: 16px; margin-top: 16px; }
          .label { font-weight: 700; }
        </style>
      </head>
      <body>
        <h1>Arogya Rural Medical Record</h1>
        <p class="muted">Visit ${escapeHtml(record.visitDate)}</p>
        <div class="block">
          <div><span class="label">Patient:</span> ${escapeHtml(getPatientName(record.Patient))}</div>
          <div><span class="label">Doctor:</span> ${escapeHtml(getDoctorName(record.Doctor))}</div>
        </div>
        <div class="block"><span class="label">Diagnosis:</span> ${escapeHtml(record.diagnosis)}</div>
        <div class="block"><span class="label">Treatment:</span> ${escapeHtml(record.treatment)}</div>
        <div class="block"><span class="label">Notes:</span> ${escapeHtml(record.notes)}</div>
        ${items
          .map(
            (item) => `
              <div class="block">
                <div><span class="label">Medicines:</span> ${escapeHtml(item.medicines)}</div>
                <div><span class="label">Dosage:</span> ${escapeHtml(item.dosageInstructions)}</div>
              </div>
            `
          )
          .join('')}
      </body>
    </html>
  `);
  win.document.close();
  win.print();
};

export default function RecordCard({ record }) {
  const recordPrescriptions = prescriptions(record);
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-2 font-semibold text-slate-950">
            <ClipboardCheck size={18} className="text-brand-700" aria-hidden="true" />
            Consultation on {formatDate(record.visitDate)}
          </p>
          <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <span className="inline-flex items-center gap-2">
              <UserRound size={16} aria-hidden="true" />
              {getPatientName(record.Patient)}
            </span>
            <span className="inline-flex items-center gap-2">
              <Stethoscope size={16} aria-hidden="true" />
              {getDoctorName(record.Doctor)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {recordPrescriptions.length > 0 && <Badge label={`${recordPrescriptions.length} prescription`} variant="subtle" />}
          {recordPrescriptions.length > 0 && (
            <Button variant="secondary" size="sm" icon={Printer} onClick={() => printRecordPrescription(record)}>
              Print
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-md bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-900">Diagnosis</p>
          <p className="mt-1 text-sm leading-6 text-slate-700">{record.diagnosis || 'Not recorded'}</p>
        </div>
        <div className="rounded-md bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-900">Treatment</p>
          <p className="mt-1 text-sm leading-6 text-slate-700">{record.treatment || 'Not recorded'}</p>
        </div>
      </div>

      {record.notes && (
        <div className="mt-3 rounded-md border border-slate-200 bg-white p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <FileText size={15} aria-hidden="true" />
            Doctor notes
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-700">{record.notes}</p>
        </div>
      )}

      {recordPrescriptions.length > 0 && (
        <div className="mt-3 space-y-2">
          {recordPrescriptions.map((prescription) => (
            <div key={prescription.id} className="rounded-md border border-brand-100 bg-brand-50 p-3 text-sm text-slate-700">
              <p>
                <span className="font-semibold text-slate-900">Medicines: </span>
                {prescription.medicines}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-900">Dosage: </span>
                {prescription.dosageInstructions}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
