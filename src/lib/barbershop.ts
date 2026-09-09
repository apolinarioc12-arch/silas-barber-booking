export type Service = {
  id: string;
  name: string;
  price: number;
  durationMin: number;
};

export const SERVICES: Service[] = [
  { id: "corte", name: "Corte", price: 35, durationMin: 40 },
  { id: "barba", name: "Barba", price: 25, durationMin: 30 },
  { id: "corte-barba", name: "Corte + Barba", price: 55, durationMin: 70 },
  { id: "sobrancelha", name: "Sobrancelha", price: 15, durationMin: 15 },
  { id: "pezinho", name: "Pézinho / Acabamento", price: 15, durationMin: 15 },
];

export const PROFESSIONALS = ["Silas", "Diego", "Lucas"];

// 0 = domingo ... 6 = sábado. Segunda (1) fechado.
export const OPENING_HOURS: Record<number, { open: string; close: string } | null> = {
  0: { open: "09:00", close: "14:00" },
  1: null,
  2: { open: "09:00", close: "20:00" },
  3: { open: "09:00", close: "20:00" },
  4: { open: "09:00", close: "20:00" },
  5: { open: "09:00", close: "20:00" },
  6: { open: "09:00", close: "20:00" },
};

export function slotsForDate(date: Date): string[] {
  const hours = OPENING_HOURS[date.getDay()];
  if (!hours) return [];
  const [openH, openM] = hours.open.split(":").map(Number);
  const [closeH, closeM] = hours.close.split(":").map(Number);
  const slots: string[] = [];
  let t = openH * 60 + openM;
  const end = closeH * 60 + closeM;
  while (t + 30 <= end) {
    slots.push(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
    t += 30;
  }
  return slots;
}

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const WEEKDAYS_FULL = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

export const SHOP = {
  name: "Barbearia Silas",
  address: "Rua Bituva, 240 - Eldorado, Diadema - SP, 09971-070",
  phone: "(11) 96615-5847",
  whatsapp: "5511966155847",
  hoursText: "Ter a Sáb · 09h às 20h · Dom · 09h às 14h",
};
