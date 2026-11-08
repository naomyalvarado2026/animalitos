import test from 'node:test';
import assert from 'node:assert/strict';
import { VOLUNTEER_ROLES_DETAILED } from '../src/data/volunteerRoles.ts';
import { buildGoogleCalendarUrl, buildWhatsAppShareUrl } from '../src/lib/calendarExport.ts';

test('cada rol de voluntariado tiene estructura completa, perrito embajador y un día típico detallado', () => {
  const validAreas = ['dog_walking', 'medical_support', 'events', 'social_media', 'shelter_maintenance', 'foster'];

  assert.equal(VOLUNTEER_ROLES_DETAILED.length, 6);

  VOLUNTEER_ROLES_DETAILED.forEach((role) => {
    assert.ok(validAreas.includes(role.id), `El área ${role.id} debe ser una de las áreas válidas del sistema`);
    assert.ok(role.title.length > 3, `El título de ${role.id} debe ser descriptivo`);
    assert.ok(role.shortDesc.length > 10, `La descripción corta de ${role.id} debe ser informativa`);
    assert.ok(role.timeCommitment.length > 5, `El compromiso de tiempo de ${role.id} debe especificarse`);
    assert.ok(role.keyActivities.length >= 3, `${role.id} debe incluir al menos 3 actividades clave`);
    assert.ok(role.typicalDay.length >= 3, `${role.id} debe tener al menos 3 hitos en su día típico`);
    assert.ok(role.requirements.length >= 3, `${role.id} debe especificar al menos 3 requisitos o sugerencias`);
    assert.ok(role.benefitedDogName.length > 1, `${role.id} debe tener un perrito embajador del refugio`);
    assert.ok(role.benefitedDogImage.startsWith('/images/'), `${role.id} debe usar una imagen local válida`);
    assert.ok(role.quote.text.length > 20, `${role.id} debe tener testimonio inspirador`);
  });
});

test('la exportación a Google Calendar y WhatsApp genera URLs válidas sin errores de formato', () => {
  const sampleActivity = {
    id: 'test-act-1',
    title: 'Paseo Matutino 🐕',
    description: 'Paseo con Scooby y Brandon por senderos naturales.',
    category: 'dog_walking',
    activity_date: '2026-11-14',
    start_time: '09:00',
    end_time: '12:00',
    location: 'Refugio Principal',
    max_volunteers: 8,
    current_volunteers: 3,
    coordinator_name: 'Camila Morales',
    coordinator_phone: '+593 99 000 0000',
    requirements: ['Calzado cómodo', 'Botella de agua'],
    status: 'scheduled',
    created_at: '2026-11-01T10:00:00Z',
    updated_at: '2026-11-01T10:00:00Z',
  };

  const gcalUrl = buildGoogleCalendarUrl(sampleActivity);
  assert.ok(gcalUrl.startsWith('https://calendar.google.com/calendar/render?action=TEMPLATE'));
  assert.ok(gcalUrl.includes(encodeURIComponent('Paseo Matutino 🐕')));
  assert.ok(gcalUrl.includes('20261114T090000'));

  const waUrl = buildWhatsAppShareUrl(sampleActivity);
  assert.ok(waUrl.startsWith('https://wa.me/?text='));
  assert.ok(waUrl.includes('2026-11-14'));
  assert.ok(waUrl.includes(encodeURIComponent('Paseo Matutino 🐕')));
});
