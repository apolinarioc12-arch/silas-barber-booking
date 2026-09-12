import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { addMyBooking, formatDateBR } from "@/lib/my-bookings";
import {
  Scissors,
  User,
  CalendarDays,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  MapPin,
  Phone,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  SERVICES,
  PROFESSIONALS,
  OPENING_HOURS,
  slotsForDate,
  formatDateISO,
  WEEKDAYS_SHORT,
  WEEKDAYS_FULL,
  SHOP,
  type Service,
} from "@/lib/barbershop";
import logoAsset from "@/assets/logo-barbearia-silas.png.asset.json";

export const Route = createFileRoute("/agendar")({
  head: () => ({
    meta: [
      { title: "Agendar — Barbearia Silas" },
      {
        name: "description",
        content:
          "Agende seu corte ou barba na Barbearia Silas em Diadema. Escolha o serviço, o profissional, o dia e o horário.",
      },
      { property: "og:title", content: "Agendar — Barbearia Silas" },
      {
        property: "og:description",
        content: "Agende seu corte ou barba na Barbearia Silas em Diadema. Rápido e direto.",
      },
    ],
  }),
  component: BookingPage,
});

type Step = "servico" | "profissional" | "data" | "horario" | "dados" | "confirmado";
const STEPS: Step[] = ["servico", "profissional", "data", "horario", "dados"];

const STEP_TITLES: Record<Exclude<Step, "confirmado">, string> = {
  servico: "Escolha o serviço",
  profissional: "Escolha o profissional",
  data: "Escolha o dia",
  horario: "Escolha o horário",
  dados: "Seus dados",
};

function BookingPage() {
  const [step, setStep] = useState<Step>("servico");
  const [service, setService] = useState<Service | null>(null);
  const [professional, setProfessional] = useState<string | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [takenSlots, setTakenSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startWeekDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  }, [currentMonth]);

  const monthLabel = useMemo(
    () =>
      currentMonth.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      }),
    [currentMonth]
  );

  const stepIndex = STEPS.indexOf(step as (typeof STEPS)[number]);

  const goTo = (s: Step) => setStep(s);

  const changeMonth = (delta: number) => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1)
    );
  };

  const pickService = (s: Service) => {
    setService(s);
    goTo("profissional");
  };

  const pickProfessional = (p: string) => {
    setProfessional(p);
    setTime(null);
    goTo("data");
  };

  const pickDate = async (d: Date) => {
    setDate(d);
    setTime(null);
    goTo("horario");
    setLoadingSlots(true);
    const { data } = await supabase.rpc("get_booked_slots", { p_date: formatDateISO(d) });
    const taken = (data ?? [])
      .filter((r: { professional: string; booking_time: string }) => r.professional === professional)
      .map((r: { booking_time: string }) => r.booking_time.slice(0, 5));
    setTakenSlots(taken);
    setLoadingSlots(false);
  };

  const pickTime = (t: string) => {
    setTime(t);
    goTo("dados");
  };

  const submit = async () => {
    if (!service || !professional || !date || !time || !name.trim() || !phone.trim() || !email.trim())
      return;
    setSubmitting(true);
    setError(null);
    const { error: err } = await supabase.from("bookings").insert({
      service: service.name,
      professional,
      booking_date: formatDateISO(date),
      booking_time: time,
      client_name: name.trim(),
      client_phone: phone.trim(),
      client_email: email.trim(),
    });
    setSubmitting(false);
    if (err) {
      if (err.code === "23505") {
        setError("Esse horário acabou de ser reservado. Escolha outro horário.");
        goTo("horario");
        if (date) pickDate(date);
      } else {
        setError("Não foi possível concluir o agendamento. Tente novamente.");
      }
      return;
    }
    addMyBooking({
      service: service.name,
      price: service.price,
      professional,
      date: formatDateISO(date),
      time,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
    });
    goTo("confirmado");
  };

  const reset = () => {
    setService(null);
    setProfessional(null);
    setDate(null);
    setTime(null);
    setName("");
    setPhone("");
    setEmail("");
    setError(null);
    goTo("servico");
  };

  const slots = date ? slotsForDate(date) : [];
  const now = new Date();
  const isToday = date ? formatDateISO(date) === formatDateISO(now) : false;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
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
          </div>
          <a
            href={`https://wa.me/${SHOP.whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Phone className="size-3.5" />
            {SHOP.phone}
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-16 pt-6">
        {step !== "confirmado" && (
          <>
            {/* Progress */}
            <div className="mb-6 flex gap-1.5">
              {STEPS.map((s, i) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= stepIndex ? "bg-primary" : "bg-secondary"
                  }`}
                />
              ))}
            </div>

            {stepIndex > 0 && (
              <button
                onClick={() => goTo(STEPS[stepIndex - 1] ?? "servico")}
                className="mb-4 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronLeft className="size-4" /> Voltar
              </button>
            )}

            <h1 className="mb-1 font-display text-2xl font-extrabold tracking-tight">
              {STEP_TITLES[step as Exclude<Step, "confirmado">]}
            </h1>

            {/* Summary chips */}
            <div className="mb-6 flex flex-wrap gap-2">
              {service && step !== "servico" && (
                <Chip icon={<Scissors className="size-3" />} label={service.name} />
              )}
              {professional && stepIndex > 1 && (
                <Chip icon={<User className="size-3" />} label={professional} />
              )}
              {date && stepIndex > 2 && (
                <Chip
                  icon={<CalendarDays className="size-3" />}
                  label={`${WEEKDAYS_SHORT[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`}
                />
              )}
              {time && stepIndex > 3 && <Chip icon={<Clock className="size-3" />} label={time} />}
            </div>
          </>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
            {error}
          </div>
        )}

        {/* STEP: serviço */}
        {step === "servico" && (
          <div className="grid gap-3">
            {SERVICES.map((s) => (
              <button
                key={s.id}
                onClick={() => pickService(s)}
                className="group flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 text-left transition-all hover:border-primary"
              >
                <div>
                  <p className="font-display text-base font-bold">{s.name}</p>
                  <p className="text-xs text-muted-foreground">~{s.durationMin} min</p>
                </div>
                <p className="font-display text-lg font-extrabold text-primary">
                  R$ {s.price}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* STEP: profissional */}
        {step === "profissional" && (
          <div className="grid gap-3">
            {PROFESSIONALS.map((p) => (
              <button
                key={p}
                onClick={() => pickProfessional(p)}
                className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 text-left transition-all hover:border-primary"
              >
                <div className="flex size-11 items-center justify-center rounded-full bg-secondary font-display text-lg font-extrabold text-primary">
                  {p[0]}
                </div>
                <div>
                  <p className="font-display text-base font-bold">{p}</p>
                  <p className="text-xs text-muted-foreground">Barbeiro</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* STEP: data */}
        {step === "data" && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base font-extrabold capitalize">
                {monthLabel}
              </h2>
              <div className="flex gap-1">
                <button
                  onClick={() => changeMonth(-1)}
                  className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  onClick={() => changeMonth(1)}
                  className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((w) => (
                <div
                  key={w}
                  className="text-center text-[11px] font-bold uppercase text-muted-foreground"
                >
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((d, i) => {
                if (!d) return <div key={`empty-${i}`} className="aspect-square" />;
                const open = OPENING_HOURS[d.getDay()] !== null;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isPast = d < today;
                const disabled = !open || isPast;
                return (
                  <button
                    key={d.toISOString()}
                    disabled={disabled}
                    onClick={() => pickDate(d)}
                    className={`aspect-square rounded-lg font-display text-sm font-bold transition-all ${
                      disabled
                        ? "cursor-not-allowed opacity-20"
                        : "hover:border-primary hover:text-primary"
                    } ${open && !isPast ? "border border-border bg-background" : ""}`}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP: horário */}
        {step === "horario" && date && (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {WEEKDAYS_FULL[date.getDay()]}, {date.getDate()} de{" "}
              {date.toLocaleDateString("pt-BR", { month: "long" })} · com {professional}
            </p>
            {loadingSlots ? (
              <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" /> Verificando horários...
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {slots.map((t) => {
                  const taken = takenSlots.includes(t);
                  const past =
                    isToday &&
                    (() => {
                      const [h = 0, m = 0] = t.split(":").map(Number);
                      const slotDate = new Date(date);
                      slotDate.setHours(h, m, 0, 0);
                      return slotDate.getTime() <= now.getTime();
                    })();
                  const disabled = taken || past;
                  return (
                    <button
                      key={t}
                      disabled={disabled}
                      onClick={() => pickTime(t)}
                      className={`rounded-lg border py-2.5 font-display text-sm font-bold transition-all ${
                        disabled
                          ? "cursor-not-allowed border-border/40 text-muted-foreground/40 line-through"
                          : "border-border bg-card hover:border-primary hover:text-primary"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* STEP: dados */}
        {step === "dados" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="grid gap-4"
          >
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
                Seu nome
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ex.: João Silva"
                className="w-full rounded-lg border border-input bg-card px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium">
                WhatsApp / telefone
              </label>
              <input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                type="tel"
                placeholder="(11) 99999-9999"
                className="w-full rounded-lg border border-input bg-card px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />
            </div>

            <div className="rounded-xl border border-border bg-card p-4 text-sm">
              <p className="mb-2 font-display font-bold">Resumo</p>
              <div className="grid gap-1 text-muted-foreground">
                <p>
                  {service?.name} · R$ {service?.price}
                </p>
                <p>
                  {professional} · {date && `${WEEKDAYS_FULL[date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}`} às {time}
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !name.trim() || !phone.trim()}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-primary py-4 font-display text-base font-extrabold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-5 animate-spin" /> Confirmando...
                </>
              ) : (
                "Confirmar agendamento"
              )}
            </button>
          </form>
        )}

        {/* CONFIRMADO */}
        {step === "confirmado" && (
          <div className="pt-6 text-center">
            <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-primary">
              <Check className="size-8 text-primary-foreground" strokeWidth={3} />
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">Agendado!</h1>
            <p className="mt-2 text-muted-foreground">
              {name.trim().split(" ")[0]}, te esperamos no dia{" "}
              <span className="font-semibold text-foreground">
                {date && `${WEEKDAYS_FULL[date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}`} às {time}
              </span>{" "}
              para {service?.name.toLowerCase()} com {professional}.
            </p>
            <div className="mt-8 grid gap-3">
              <button
                onClick={reset}
                className="rounded-xl border border-primary py-3.5 font-display font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Fazer outro agendamento
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto grid max-w-lg gap-3 px-4 py-6 text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
            {SHOP.address}
          </p>
          <p className="flex items-start gap-2">
            <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
            {SHOP.hoursText}
          </p>
        </div>
      </footer>
    </div>
  );
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
      {icon}
      {label}
    </span>
  );
}
