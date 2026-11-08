import { useState } from 'react';
import { Calendar, Clock, Check } from 'lucide-react';

const DAYS = [
  { id: 'Lun', label: 'Lunes' },
  { id: 'Mar', label: 'Martes' },
  { id: 'Mié', label: 'Miércoles' },
  { id: 'Jue', label: 'Jueves' },
  { id: 'Vie', label: 'Viernes' },
  { id: 'Sáb', label: 'Sábado' },
  { id: 'Dom', label: 'Domingo' },
];

const TIMES = [
  { id: 'Mañana', label: 'Mañana', hours: '08:00–12:00', icon: '☀️' },
  { id: 'Tarde', label: 'Tarde', hours: '12:00–17:00', icon: '🌤️' },
  { id: 'Flexible', label: 'Horario flexible', hours: 'A coordinar', icon: '🤝' },
];

export function VolunteerAvailabilityPicker({ onChange }: { onChange: (summary: string) => void }) {
  const [days, setDays] = useState<string[]>([]);
  const [times, setTimes] = useState<string[]>([]);

  function update(nextDays: string[], nextTimes: string[]) {
    setDays(nextDays);
    setTimes(nextTimes);
    const selectedDays = DAYS.filter((day) => nextDays.includes(day.id)).map((day) => day.label);
    const selectedTimes = TIMES.filter((time) => nextTimes.includes(time.id)).map((time) => `${time.label} (${time.hours})`);
    onChange(selectedDays.length && selectedTimes.length ? `${selectedDays.join(', ')} · ${selectedTimes.join(', ')}` : '');
  }

  function toggleDay(day: string) {
    update(days.includes(day) ? days.filter((item) => item !== day) : [...days, day], times);
  }

  function toggleTime(time: string) {
    update(days, times.includes(time) ? times.filter((item) => item !== time) : [...times, time]);
  }

  function selectWeekend() {
    update(['Sáb', 'Dom'], times.length ? times : ['Mañana']);
  }

  function selectWeekdays() {
    update(['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], times.length ? times : ['Tarde']);
  }

  function selectAllDays() {
    update(DAYS.map((d) => d.id), times.length ? times : ['Flexible']);
  }

  function clearAll() {
    update([], []);
  }

  const hasSelection = days.length > 0 || times.length > 0;

  return (
    <div className="space-y-6 rounded-2xl border border-[#171717]/10 bg-[#faf7f2] p-5 sm:p-6">
      {/* Days selection */}
      <fieldset>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <legend className="text-sm font-bold text-[#171717] flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#f0644a]" /> ¿Qué días te vienen bien?
          </legend>
          {hasSelection && (
            <button
              type="button"
              onClick={clearAll}
              className="text-[11px] font-semibold text-[#6e6a64] hover:text-[#f0644a] underline"
            >
              Limpiar selección
            </button>
          )}
        </div>

        {/* Quick presets */}
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={selectWeekend}
            className="rounded-lg border border-[#171717]/15 bg-white px-3 py-1 font-semibold text-[#171717] transition hover:border-[#f0644a] hover:bg-[#fff9f7]"
          >
            Solo fines de semana (Sáb - Dom)
          </button>
          <button
            type="button"
            onClick={selectWeekdays}
            className="rounded-lg border border-[#171717]/15 bg-white px-3 py-1 font-semibold text-[#171717] transition hover:border-[#f0644a] hover:bg-[#fff9f7]"
          >
            Días laborables (Lun - Vie)
          </button>
          <button
            type="button"
            onClick={selectAllDays}
            className="rounded-lg border border-[#171717]/15 bg-white px-3 py-1 font-semibold text-[#171717] transition hover:border-[#f0644a] hover:bg-[#fff9f7]"
          >
            Cualquier día
          </button>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
          {DAYS.map((day) => {
            const isSelected = days.includes(day.id);
            return (
              <button
                key={day.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleDay(day.id)}
                className={`min-h-11 rounded-xl border px-2 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0644a] ${
                  isSelected
                    ? 'border-[#f0644a] bg-[#f0644a] text-white shadow-xs'
                    : 'border-[#171717]/15 bg-white text-[#4f4a45] hover:border-[#f0644a]'
                }`}
              >
                <span className="sm:hidden">{day.id}</span>
                <span className="hidden sm:inline">{day.label}</span>
                {isSelected && <Check className="ml-1 inline h-3 w-3" />}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Time slots */}
      <fieldset>
        <legend className="text-sm font-bold text-[#171717] flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#f0644a]" /> ¿En qué horario?
        </legend>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
          {TIMES.map((time) => {
            const isSelected = times.includes(time.id);
            return (
              <button
                key={time.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleTime(time.id)}
                className={`rounded-xl border p-3.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0644a] ${
                  isSelected
                    ? 'border-[#f0644a] bg-[#ffe0d7]/60 text-[#171717] ring-1 ring-[#f0644a]'
                    : 'border-[#171717]/15 bg-white text-[#4f4a45] hover:border-[#f0644a]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#171717] flex items-center gap-1.5">
                    <span>{time.icon}</span> {time.label}
                  </span>
                  {isSelected && <Check className="h-4 w-4 text-[#f0644a]" />}
                </div>
                <span className="mt-1 block text-xs text-[#6e6a64] font-medium">{time.hours}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Dynamic Summary Tag */}
      {days.length > 0 && times.length > 0 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-800">
          <strong className="font-bold">Disponibilidad seleccionada:</strong>{' '}
          {DAYS.filter((d) => days.includes(d.id)).map((d) => d.label).join(', ')} ·{' '}
          {TIMES.filter((t) => times.includes(t.id)).map((t) => t.label).join(', ')}
        </div>
      ) : (
        <p className="text-xs leading-relaxed text-[#6e6a64]">
          💡 Elige al menos un día y un horario de preferencia. El equipo coordinará contigo los turnos exactos.
        </p>
      )}
    </div>
  );
}
