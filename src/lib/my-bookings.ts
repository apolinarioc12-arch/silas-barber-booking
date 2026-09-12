export type StoredBooking = {
  id: string;
  service: string;
  price: number;
  professional: string;
  date: string; // ISO yyyy-mm-dd
  time: string; // HH:mm
  name: string;
  phone: string;
  email: string;
  createdAt: string;
};

const KEY = "barbearia-silas:meus-agendamentos";

export function getMyBookings(): StoredBooking[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredBooking[]) : [];
  } catch {
    return [];
  }
}

export function addMyBooking(booking: Omit<StoredBooking, "id" | "createdAt">): void {
  if (typeof window === "undefined") return;
  const list = getMyBookings();
  list.unshift({
    ...booking,
    id: `${booking.date}-${booking.time}-${booking.professional}`,
    createdAt: new Date().toISOString(),
  });
  window.localStorage.setItem(KEY, JSON.stringify(list));
}

export function removeMyBooking(id: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(getMyBookings().filter((b) => b.id !== id)));
}

export function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

export function weekdayFromISO(iso: string, weekdays: string[]): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  return weekdays[new Date(y, m - 1, d).getDay()] ?? "";
}

export function isUpcoming(booking: StoredBooking): boolean {
  const [y, m, d] = booking.date.split("-").map(Number);
  const [h = 0, min = 0] = booking.time.split(":").map(Number);
  if (!y || !m || !d) return false;
  return new Date(y, m - 1, d, h, min).getTime() >= Date.now();
}
