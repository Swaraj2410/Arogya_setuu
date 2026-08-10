import React, { useEffect, useState } from 'react';
import { Pill } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import PrescriptionCard from '../components/PrescriptionCard';
import SectionCard from '../components/SectionCard';
import DashboardLayout from '../layouts/DashboardLayout';
import { fetchPrescriptions } from '../api/prescriptions';
import { useAuth } from '../state/AuthContext';

export default function PrescriptionsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchPrescriptions({
          patientId: user?.role === 'patient' ? user?.patientId : undefined,
          doctorId: user?.role === 'doctor' ? user?.doctorId : undefined
        });
        setItems(data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'We could not load prescriptions.');
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id, user?.role, user?.patientId, user?.doctorId]);

  return (
    <DashboardLayout role={user?.role || 'patient'} title="Prescriptions" subtitle="Digital medicine and dosage documents">
      <PageHeader
        eyebrow="Digital prescriptions"
        title={user?.role === 'doctor' ? 'Prescription history' : 'Your prescriptions'}
        text="Prescription cards show medicines and dosage instructions from completed consultation records."
      />

      <SectionCard title="Prescription Documents" action={<span className="text-sm text-slate-500">{items.length} total</span>}>
        {error && <p className="mb-4 rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}
        {loading ? (
          <p className="text-sm text-slate-600">Loading prescriptions...</p>
        ) : items.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {items.map((prescription) => (
              <PrescriptionCard key={prescription.id} prescription={prescription} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Pill}
            title="No prescriptions yet"
            text="Digital prescriptions will appear after a doctor adds them to a medical record."
          />
        )}
      </SectionCard>
    </DashboardLayout>
  );
}
