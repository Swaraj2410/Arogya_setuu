import React, { useEffect, useState } from 'react';
import { Bell, CalendarDays, CheckCircle2, FileText, Pill } from 'lucide-react';
import Badge from '../components/Badge';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import DashboardLayout from '../layouts/DashboardLayout';
import { fetchNotifications, markNotification } from '../api/notifications';
import { useAuth } from '../state/AuthContext';

const iconForType = {
  appointment: CalendarDays,
  record: FileText,
  prescription: Pill,
  'follow-up': CalendarDays,
  report: FileText
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchNotifications();
        setItems(data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'We could not load notifications.');
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleMarkRead = async (id) => {
    const previous = items;
    setItems((list) => list.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
    try {
      await markNotification(id);
    } catch (err) {
      setItems(previous);
      setError(err.response?.data?.message || 'We could not mark this notification as read.');
    }
  };

  const unreadCount = items.filter((item) => !item.isRead).length;

  return (
    <DashboardLayout role={user?.role || 'patient'} title="Notifications" subtitle="Care updates, schedule messages, and record alerts">
      <PageHeader
        eyebrow="Notification center"
        title="Stay updated about village visits and care activity"
        text="Unread messages are highlighted so important appointment and record updates are easy to notice."
      />

      <SectionCard title="Inbox" action={<Badge label={`${unreadCount} unread`} variant={unreadCount ? 'warm' : 'subtle'} />}>
        {error && <p className="mb-4 rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}
        {loading ? (
          <p className="text-sm text-slate-600">Loading notifications...</p>
        ) : items.length > 0 ? (
          <div className="space-y-3">
            {items.map((note) => {
              const Icon = iconForType[note.type] || Bell;
              return (
                <div
                  key={note.id}
                  className={`rounded-lg border p-4 ${
                    note.isRead ? 'border-slate-200 bg-white' : 'border-earth-200 bg-earth-50'
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700">
                        <Icon size={19} aria-hidden="true" />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-950">{note.title}</p>
                          {!note.isRead && <Badge label="Unread" variant="warm" />}
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-700">{note.message}</p>
                        <p className="mt-2 text-xs font-semibold uppercase text-slate-500">{note.type}</p>
                      </div>
                    </div>
                    {note.isRead ? (
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500">
                        <CheckCircle2 size={16} aria-hidden="true" />
                        Read
                      </span>
                    ) : (
                      <Button variant="secondary" size="sm" onClick={() => handleMarkRead(note.id)}>
                        Mark read
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            text="Appointment confirmations, schedule updates, and prescription messages will appear here."
          />
        )}
      </SectionCard>
    </DashboardLayout>
  );
}
