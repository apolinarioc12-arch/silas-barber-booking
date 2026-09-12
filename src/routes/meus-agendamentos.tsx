import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, Clock, Scissors, User, Mail, Phone, Trash2, CalendarX } from "lucide-react";
import { SHOP, WEEKDAYS_FULL } from "@/lib/barbershop";
import {
  getMyBookings,
  removeMyBooking,
  formatDateBR,
  weekdayFromISO,
  isUpcoming,
  type StoredBooking,
} from "@/lib/my-bookings";
import logoAsset from "@/assets/logo-barbearia-silas.png.asset.json";

export const Route = createFileRoute("/meus-agendamentos")({
  head: () => ({
    meta: [
      { title: "Meus agendamentos — Barbearia Silas" },
      {
        name: "description",
        content:
          "Veja os horários que você agendou na Barbearia Silas em Diadema: serviço, barbeiro, data e horário.",
      },
      { property: "og:title", content: "Meus agendamentos — Barbearia Silas" },
      {
        property: "og:description",
        content: "Acompanhe seus horários agendados na Barbearia Silas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyBookingsPage,
});

function MyBookingsPage() {
  const [bookings, setBookings] = useState<StoredBooking[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setBookings(getMyBookings());
    setLoaded(true);
  }, []);

  const remove = (id: string) => {
    removeMyBooking(id);
    setBookings(getMyBookings());
  };

  const upcoming = bookings.filter(isUpcoming);
  const past = bookings.filter((b) => !isUpcoming(b));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logoAsset.url}
              alt="Logo Barbearia Silas"
              width={48}
              height={48}
              className="size-12 object-contain"
            />
            <div>
              <p className="font-display text-lg font-extrabold leading-tight">{SHOP.name}</p>
              <p className="text-xs text-muted-foreground">Diadema · SP</p>
            </div>
          </Link>
          <Link
            to="/agendar"
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <CalendarCheck className="size-3.5" />
            Agendar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-16 pt-6">
        <h1 className="mb-1 font-display text-2xl font-extrabold tracking-tight">
          Meus agendamentos
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Seus horários confirmados neste aparelho.
        </p>

        {loaded && bookings.length === 0 && (
          <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
            <CalendarX className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="mb-1 font-display font-bold">Nenhum agendamento por aqui</p>
            <p className="mb-6 text-sm text-muted-foreground">
              Assim que você confirmar um horário, ele aparece nesta página.
            </p>
            <Link
              to="/agendar"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-display text-sm font-extrabold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <CalendarCheck className="size-4" />
              Fazer meu agendamento
            </Link>
          </div>
        )}

        {upcoming.length > 0 && (
          <section className="mb-8 grid gap-3">
            <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-primary">
              Próximos
            </h2>
            {upcoming.map((b) => (
              <BookingCard key={b.id} booking={b} onRemove={remove} />
            ))}
          </section>
        )}

        {past.length > 0 && (
          <section className="grid gap-3">
            <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
              Anteriores
            </h2>
            {past.map((b) => (
              <BookingCard key={b.id} booking={b} onRemove={remove} muted />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

function BookingCard({
  booking,
  onRemove,
  muted,
}: {
  booking: StoredBooking;
  onRemove: (id: string) => void;
  muted?: boolean;
}) {
  return (
    <article
      className={`rounded-xl border border-border bg-card p-5 ${muted ? "opacity-60" : ""}`}
    >
      <div className="grid gap-1.5 text-sm">
        <Line icon={<Scissors className="size-4 text-primary" />} label="Serviço" value={booking.service} />
        <Line icon={<User className="size-4 text-primary" />} label="Barbeiro" value={booking.professional} />
        <Line
          icon={<CalendarCheck className="size-4 text-primary" />}
          label="Data"
          value={`${formatDateBR(booking.date)} - ${weekdayFromISO(booking.date, WEEKDAYS_FULL)}`}
        />
        <Line icon={<Clock className="size-4 text-primary" />} label="Horário" value={booking.time} />
        <Line icon={<Phone className="size-4 text-primary" />} label="Telefone" value={booking.phone} />
        {booking.email && (
          <Line icon={<Mail className="size-4 text-primary" />} label="E-mail" value={booking.email} />
        )}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className="font-display text-lg font-extrabold text-primary">R$ {booking.price}</p>
        <button
          onClick={() => onRemove(booking.id)}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
          Remover da lista
        </button>
      </div>
    </article>
  );
}

function Line({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <p className="flex items-center gap-2">
      {icon}
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </p>
  );
}
