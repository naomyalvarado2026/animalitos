import type { VolunteerActivity } from '@/types';

function formatToIcsDate(dateStr: string, timeStr = '09:00'): string {
  try {
    const cleanDate = dateStr.slice(0, 10).replace(/-/g, '');
    const [hours, minutes] = (timeStr || '09:00').split(':').map((s) => s.padStart(2, '0'));
    return `${cleanDate}T${hours}${minutes}00`;
  } catch {
    return '20261115T090000';
  }
}

export function buildGoogleCalendarUrl(activity: VolunteerActivity): string {
  const start = formatToIcsDate(activity.activity_date, activity.start_time);
  const end = formatToIcsDate(activity.activity_date, activity.end_time || '12:00');
  const title = encodeURIComponent(`🐾 Voluntariado AdoptaME: ${activity.title}`);
  const details = encodeURIComponent(
    `${activity.description}\n\nCoordinador: ${activity.coordinator_name || 'Equipo AdoptaME'}\nRequisitos: ${(activity.requirements || []).join(', ')}\n\nLugar: ${activity.location || 'Refugio AdoptaME'}`
  );
  const location = encodeURIComponent(activity.location || 'Refugio AdoptaME');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
}

export function downloadIcsFile(activity: VolunteerActivity): void {
  const start = formatToIcsDate(activity.activity_date, activity.start_time);
  const end = formatToIcsDate(activity.activity_date, activity.end_time || '12:00');
  const now = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';

  const cleanDescription = (activity.description || '')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AdoptaME//Voluntariado//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:adoptame-vol-${activity.id}-${Date.now()}@adoptame.org`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:🐾 Voluntariado AdoptaME: ${activity.title}`,
    `DESCRIPTION:${cleanDescription}`,
    `LOCATION:${activity.location || 'Refugio Principal'}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `voluntariado-${activity.activity_date}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function buildWhatsAppShareUrl(activity: VolunteerActivity): string {
  const text = encodeURIComponent(
    `¡Hola! 🐾 Me uniré como voluntario en la actividad "${activity.title}" de AdoptaME el ${activity.activity_date} (${activity.start_time || '09:00'} - ${activity.end_time || '12:00'}). ¿Te animas a sumarte conmigo? Revisa la agenda en: https://naomyalvarado2026.github.io/animalitos/voluntariado`
  );
  return `https://wa.me/?text=${text}`;
}
