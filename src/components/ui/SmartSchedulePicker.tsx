import { useState, useMemo, useEffect } from 'react';
import { Calendar, Clock, RotateCw, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { EventType, RecurrencePattern } from '@/types';

export interface ScheduleValue {
  event_type: EventType;
  start_date: string;
  end_date?: string;
  start_time: string;
  end_time: string;
  selected_days: string[]; // ['mon', 'tue', ...]
  recurrence_pattern: RecurrencePattern;
  summary: string;
}

interface SmartSchedulePickerProps {
  value?: Partial<ScheduleValue>;
  onChange: (value: ScheduleValue) => void;
  compact?: boolean;
}

const WEEKDAYS = [
  { id: 'mon', label: 'Lun', short: 'L' },
  { id: 'tue', label: 'Mar', short: 'M' },
  { id: 'wed', label: 'Mié', short: 'X' },
  { id: 'thu', label: 'Jue', short: 'J' },
  { id: 'fri', label: 'Vie', short: 'V' },
  { id: 'sat', label: 'Sáb', short: 'S' },
  { id: 'sun', label: 'Dom', short: 'D' },
];

const TIME_OPTIONS = Array.from({ length: 30 }).map((_, i) => {
  const hour = Math.floor(i / 2) + 7; // Starts at 07:00
  const minute = i % 2 === 0 ? '00' : '30';
  const formattedHour = hour < 10 ? `0${hour}` : `${hour}`;
  return `${formattedHour}:${minute}`;
});

export function SmartSchedulePicker({ value, onChange, compact = false }: SmartSchedulePickerProps) {
  const [eventType, setEventType] = useState<EventType>(value?.event_type || 'single_day');
  const [startDate, setStartDate] = useState<string>(value?.start_date || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(value?.end_date || '');
  const [startTime, setStartTime] = useState<string>(value?.start_time || '09:00');
  const [endTime, setEndTime] = useState<string>(value?.end_time || '12:00');
  const [selectedDays, setSelectedDays] = useState<string[]>(value?.selected_days || ['sat', 'sun']);
  const [recurrence, setRecurrence] = useState<RecurrencePattern>(value?.recurrence_pattern || 'weekly');

  // Compute duration
  const durationText = useMemo(() => {
    const [h1, m1] = startTime.split(':').map(Number);
    const [h2, m2] = endTime.split(':').map(Number);
    let diffMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diffMinutes < 0) diffMinutes += 24 * 60;
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    if (hours === 0 && mins === 0) return '0 hrs';
    return `${hours > 0 ? `${hours} hrs` : ''} ${mins > 0 ? `${mins} min` : ''}`.trim();
  }, [startTime, endTime]);

  // Generate human-readable summary
  const summaryText = useMemo(() => {
    const daysLabels = selectedDays.map(d => WEEKDAYS.find(w => w.id === d)?.label).filter(Boolean);
    let daysStr = '';
    if (daysLabels.length === 7) daysStr = 'Todos los días';
    else if (daysLabels.length === 2 && selectedDays.includes('sat') && selectedDays.includes('sun')) daysStr = 'Fines de semana (Sáb - Dom)';
    else if (daysLabels.length === 5 && !selectedDays.includes('sat') && !selectedDays.includes('sun')) daysStr = 'Días laborables (Lun - Vie)';
    else if (daysLabels.length > 0) daysStr = `Días: ${daysLabels.join(', ')}`;
    else daysStr = 'Sin días seleccionados';

    let recStr = '';
    if (recurrence === 'none') recStr = 'Evento puntual (Sin repetición)';
    else if (recurrence === 'weekly') recStr = 'Repetición Semanal';
    else if (recurrence === 'monthly') recStr = 'Repetición Mensual';
    else if (recurrence === 'yearly') recStr = 'Repetición Anual';

    const rangeStr = eventType === 'multi_day' && endDate ? `Del ${startDate} al ${endDate}` : `Fecha: ${startDate}`;

    return `${daysStr} | ${startTime} a ${endTime} (${durationText}) | ${recStr} | ${rangeStr}`;
  }, [eventType, startDate, endDate, startTime, endTime, selectedDays, recurrence, durationText]);

  // Emit changes
  useEffect(() => {
    onChange({
      event_type: eventType,
      start_date: startDate,
      end_date: eventType === 'multi_day' ? endDate : undefined,
      start_time: startTime,
      end_time: endTime,
      selected_days: selectedDays,
      recurrence_pattern: recurrence,
      summary: summaryText,
    });
  }, [eventType, startDate, endDate, startTime, endTime, selectedDays, recurrence, summaryText]);

  const toggleDay = (dayId: string) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter(d => d !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  const applyPreset = (preset: 'weekends' | 'weekdays' | 'all') => {
    if (preset === 'weekends') setSelectedDays(['sat', 'sun']);
    if (preset === 'weekdays') setSelectedDays(['mon', 'tue', 'wed', 'thu', 'fri']);
    if (preset === 'all') setSelectedDays(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
  };

  return (
    <div className="space-y-4 bg-[var(--color-card)] p-4 sm:p-5 rounded-2xl border border-[var(--color-border)] shadow-xs">
      {/* Dynamic Summary Banner */}
      <div className="bg-[var(--color-background)] p-3 rounded-xl border border-[var(--color-border)] flex items-start gap-2.5">
        <Sparkles className="h-4 w-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)] block">Resumen de Horario Programado</span>
          <p className="text-xs font-semibold text-[var(--color-foreground)] leading-tight mt-0.5">{summaryText}</p>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setEventType('single_day')}
          className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
            eventType === 'single_day'
              ? 'brand-gradient-bg text-white border-transparent shadow-xs'
              : 'bg-[var(--color-background)] text-[var(--color-muted-foreground)] border-[var(--color-border)] hover:border-[var(--color-primary)]'
          }`}
        >
          <Calendar className="h-3.5 w-3.5" /> Día Único
        </button>
        <button
          type="button"
          onClick={() => setEventType('multi_day')}
          className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
            eventType === 'multi_day'
              ? 'brand-gradient-bg text-white border-transparent shadow-xs'
              : 'bg-[var(--color-background)] text-[var(--color-muted-foreground)] border-[var(--color-border)] hover:border-[var(--color-primary)]'
          }`}
        >
          <Calendar className="h-3.5 w-3.5" /> Rango Multidía
        </button>
      </div>

      {/* Date Pickers */}
      <div className={`grid ${eventType === 'multi_day' ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
        <div className="space-y-1">
          <Label className="text-xs">Fecha Inicio</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 text-xs" />
        </div>
        {eventType === 'multi_day' && (
          <div className="space-y-1">
            <Label className="text-xs">Fecha Fin</Label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 text-xs" />
          </div>
        )}
      </div>

      {/* Time Pickers */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1">
            <Clock className="h-3 w-3 text-[var(--color-primary)]" /> Hora Inicio
          </Label>
          <select
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            className="flex h-9 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] px-2.5 py-1 text-xs"
          >
            {TIME_OPTIONS.map(t => (
              <option key={`start-${t}`} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-[var(--color-primary)]" /> Hora Fin
            </span>
            <Badge variant="outline" className="text-[10px] py-0">{durationText}</Badge>
          </Label>
          <select
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
            className="flex h-9 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] px-2.5 py-1 text-xs"
          >
            {TIME_OPTIONS.map(t => (
              <option key={`end-${t}`} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Weekdays Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">Días Disponibles de la Semana</Label>
          <div className="flex items-center gap-1 text-[10px]">
            <button type="button" onClick={() => applyPreset('weekends')} className="text-[var(--color-primary)] hover:underline">Fin de Sem</button>
            <span>·</span>
            <button type="button" onClick={() => applyPreset('weekdays')} className="text-[var(--color-primary)] hover:underline">Laborables</button>
            <span>·</span>
            <button type="button" onClick={() => applyPreset('all')} className="text-[var(--color-primary)] hover:underline">Todos</button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-1">
          {WEEKDAYS.map(day => {
            const isSelected = selectedDays.includes(day.id);
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => toggleDay(day.id)}
                className={`w-9 h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center border ${
                  isSelected
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-[var(--color-primary)] shadow-xs scale-105'
                    : 'bg-[var(--color-background)] text-[var(--color-muted-foreground)] border-[var(--color-border)] hover:border-[var(--color-primary)]'
                }`}
              >
                {day.short}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recurrence Selector */}
      <div className="space-y-1">
        <Label className="text-xs flex items-center gap-1">
          <RotateCw className="h-3 w-3 text-[var(--color-primary)]" /> Programación de Repetición
        </Label>
        <select
          value={recurrence}
          onChange={e => setRecurrence(e.target.value as RecurrencePattern)}
          className="flex h-9 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] px-2.5 py-1 text-xs"
        >
          <option value="none">Puntual (Un solo día/evento - Sin repetición)</option>
          <option value="weekly">Semanal (Se repite todas las semanas los días elegidos)</option>
          <option value="monthly">Mensual (Se repite una vez al mes)</option>
          <option value="yearly">Anual (Se repite una vez al año)</option>
        </select>
      </div>
    </div>
  );
}
