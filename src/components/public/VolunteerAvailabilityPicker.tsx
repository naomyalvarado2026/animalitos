import { useState } from 'react';

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
  { id: 'Mañana', label: 'Mañana', hours: '08:00–12:00' },
  { id: 'Tarde', label: 'Tarde', hours: '12:00–17:00' },
  { id: 'Flexible', label: 'Horario flexible', hours: 'a coordinar' },
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

  return (
    <div className="space-y-5 rounded-2xl border border-[#171717]/10 bg-[#faf7f2] p-4 sm:p-5">
      <fieldset>
        <legend className="text-sm font-semibold">¿Qué días te vienen bien?</legend>
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
          {DAYS.map((day) => (
            <button key={day.id} type="button" aria-pressed={days.includes(day.id)} onClick={() => toggleDay(day.id)} className={`min-h-11 rounded-xl border px-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3c096c] ${days.includes(day.id) ? 'border-[#3c096c] bg-[#3c096c] text-white' : 'border-[#171717]/15 bg-white text-[#4f4a45] hover:border-[#3c096c]'}`}>
              <span className="sm:hidden">{day.id}</span><span className="hidden sm:inline">{day.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <button type="button" onClick={() => update(['Sáb', 'Dom'], times)} className="font-semibold text-[#3c096c] underline-offset-2 hover:underline">Solo fines de semana</button>
          <button type="button" onClick={() => update(['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], times)} className="font-semibold text-[#3c096c] underline-offset-2 hover:underline">Días laborables</button>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold">¿En qué horario?</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {TIMES.map((time) => (
            <button key={time.id} type="button" aria-pressed={times.includes(time.id)} onClick={() => toggleTime(time.id)} className={`rounded-xl border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3c096c] ${times.includes(time.id) ? 'border-[#3c096c] bg-[#e0beff]/45 text-[#17022b]' : 'border-[#171717]/15 bg-white text-[#4f4a45] hover:border-[#3c096c]'}`}>
              <span className="block text-sm font-bold">{time.label}</span>
              <span className="mt-0.5 block text-xs opacity-75">{time.hours}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <p className="text-xs leading-relaxed text-[#6e6a64]">El equipo confirmará contigo los horarios y actividades disponibles.</p>
    </div>
  );
}
