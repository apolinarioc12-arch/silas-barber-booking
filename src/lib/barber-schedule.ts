import { OPENING_HOURS } from "./barbershop";

export type BarberRow = {
  id: string;
  name: string;
  active: boolean;
};

export type ScheduleRow = {
  id?: string;
  barber_id: string;
  weekday: number;
  works: boolean;
  start_time: string;
  end_time: string;
  lunch_start: string | null;
  lunch_end: string | null;
};

export function toMinutes(t: string | null | undefined): number | null {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  if (h === undefined || m === undefined || Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export function toHHMM(t: string | null | undefined): string {
  return (t ?? "").slice(0, 5);
}

function fromMinutes(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

/**
 * Horários disponíveis para um barbeiro num dia, combinando o horário de
 * funcionamento da barbearia com o horário individual (e o almoço).
 */
export function slotsForBarber(date: Date, schedule: ScheduleRow | null | undefined): string[] {
  const shop = OPENING_HOURS[date.getDay()];
  if (!shop) return [];

  const shopOpen = toMinutes(shop.open) ?? 0;
  const shopClose = toMinutes(shop.close) ?? 0;

  let start = shopOpen;
  let end = shopClose;
  let lunchStart: number | null = null;
  let lunchEnd: number | null = null;

  if (schedule) {
    if (!schedule.works) return [];
    start = Math.max(start, toMinutes(toHHMM(schedule.start_time)) ?? shopOpen);
    end = Math.min(end, toMinutes(toHHMM(schedule.end_time)) ?? shopClose);
    lunchStart = toMinutes(toHHMM(schedule.lunch_start));
    lunchEnd = toMinutes(toHHMM(schedule.lunch_end));
  }

  const slots: string[] = [];
  for (let t = start; t + 30 <= end; t += 30) {
    if (lunchStart !== null && lunchEnd !== null && t < lunchEnd && t + 30 > lunchStart) continue;
    slots.push(fromMinutes(t));
  }
  return slots;
}

export const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];
