import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  CalendarDays,
  Clock,
  LayoutDashboard,
  LogOut,
  Loader2,
  Plus,
  Trash2,
  Users,
  Check,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SERVICES, SHOP, WEEKDAYS_FULL, formatDateISO } from "@/lib/barbershop";
import {
  WEEKDAY_LABELS,
  slotsForBarber,
  toHHMM,
  type BarberRow,
  type ScheduleRow,
} from "@/lib/barber-schedule";
import { formatDateBR } from "@/lib/my-bookings";
import logoAsset from "@/assets/logo-barbearia-silas.png.asset.json";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel do barbeiro — Barbearia Silas" },
      {
        name: "description",
        content:
          "Agenda, horários de trabalho e atendimentos da equipe da Barbearia Silas em Diadema.",
      },
      { property: "og:title", content: "Painel do barbeiro — Barbearia Silas" },
      { property: "og:description", content: "Agenda e atendimentos da equipe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PainelPage,
});

type Booking = {
  id: string;
  service: string;
  professional: string;
  booking_date: string;
  booking_time: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  status: string;
  barber_id: string | null;
};

type Tab = "agenda" | "horarios" | "dashboard" | "equipe";

function PainelPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("agenda");
  const [me, setMe] = useState<BarberRow | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [team, setTeam] = useState<BarberRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id ?? null;
    setUserId(uid);
    if (!uid) return;

    const [{ data: barber }, { data: roles }, { data: allBarbers }] = await Promise.all([
      supabase.from("barbers").select("id, name, active").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("barbers").select("id, name, active").order("name"),
    ]);

    setMe((barber as BarberRow) ?? null);
    setIsOwner((roles ?? []).some((r: { role: string }) => r.role === "owner"));
    setTeam((allBarbers as BarberRow[]) ?? []);

    const { data: sched } = await supabase
      .from("barber_schedules")
      .select("id, barber_id, weekday, works, start_time, end_time, lunch_start, lunch_end")
      .eq("barber_id", uid)
      .order("weekday");
    setSchedules((sched as ScheduleRow[]) ?? []);

    const year = new Date().getFullYear();
    const { data: bks } = await supabase
      .from("bookings")
      .select(
        "id, service, professional, booking_date, booking_time, client_name, client_phone, client_email, status, barber_id"
      )
      .gte("booking_date", `${year}-01-01`)
      .lte("booking_date", `${year}-12-31`)
      .order("booking_date")
      .order("booking_time");
    setBookings((bks as Booking[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/barbeiro", replace: true });
  };

  const myBookings = useMemo(() => {
    if (!me) return [];
    return bookings.filter(
      (b) => b.barber_id === me.id || b.professional.toLowerCase() === me.name.toLowerCase()
    );
  }, [bookings, me]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-background text-muted-foreground">
        <Loader2 className="size-5 animate-spin" /> Carregando painel...
      </div>
    );
  }

  if (!me) {
    return (
      <div className="min-h-screen bg-background">
        <PainelHeader onSignOut={signOut} subtitle="Área da equipe" />
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <h1 className="mb-3 font-display text-xl font-extrabold">Conta sem barbeiro vinculado</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Peça ao dono da barbearia para liberar o seu acesso.
          </p>
          <FinishRegistration userId={userId} onDone={load} />
        </main>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "agenda", label: "Agenda", icon: <CalendarDays className="size-4" /> },
    { id: "horarios", label: "Meus horários", icon: <Clock className="size-4" /> },
    { id: "dashboard", label: "Atendimentos", icon: <LayoutDashboard className="size-4" /> },
    ...(isOwner
      ? [{ id: "equipe" as Tab, label: "Equipe", icon: <Users className="size-4" /> }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <PainelHeader onSignOut={signOut} subtitle={`Olá, ${me.name}`} />

      {!me.active && (
        <div className="mx-auto mt-4 max-w-4xl px-4">
          <div className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
            Sua conta ainda não foi liberada pelo dono. Você já pode configurar seus horários, mas
            não aparece para os clientes.
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl px-4 pt-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
                tab === t.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 pb-20 pt-6">
        {tab === "agenda" && (
          <AgendaTab me={me} isOwner={isOwner} bookings={bookings} team={team} onChange={load} />
        )}
        {tab === "horarios" && (
          <HorariosTab barberId={me.id} schedules={schedules} onChange={load} />
        )}
        {tab === "dashboard" && <DashboardTab bookings={isOwner ? bookings : myBookings} />}
        {tab === "equipe" && <EquipeTab team={team} onChange={load} />}
      </main>
    </div>
  );
}

function PainelHeader({ onSignOut, subtitle }: { onSignOut: () => void; subtitle: string }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={logoAsset.url}
            alt="Logo Barbearia Silas"
            width={44}
            height={44}
            className="size-11 object-contain"
          />
          <div>
            <p className="font-display text-base font-extrabold leading-tight">{SHOP.name}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </Link>
        <button
          onClick={onSignOut}
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <LogOut className="size-3.5" /> Sair
        </button>
      </div>
    </header>
  );
}

function FinishRegistration({ userId, onDone }: { userId: string | null; onDone: () => void }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  if (!userId) return null;
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        await supabase.rpc("claim_barber_account", { p_name: name.trim() });
        setSaving(false);
        onDone();
      }}
      className="grid gap-3"
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="Seu nome"
        className="w-full rounded-lg border border-input bg-card px-4 py-3 text-sm outline-none focus:border-primary"
      />
      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-primary py-3 font-display text-sm font-extrabold text-primary-foreground disabled:opacity-40"
      >
        {saving ? "Salvando..." : "Concluir cadastro"}
      </button>
    </form>
  );
}

/* ---------------- Agenda ---------------- */

function AgendaTab({
  me,
  isOwner,
  bookings,
  team,
  onChange,
}: {
  me: BarberRow;
  isOwner: boolean;
  bookings: Booking[];
  team: BarberRow[];
  onChange: () => void;
}) {
  const [day, setDay] = useState(() => formatDateISO(new Date()));
  const [who, setWho] = useState<string>(me.name);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const dayBookings = bookings
    .filter((b) => b.booking_date === day)
    .filter((b) => (isOwner && who === "todos" ? true : b.professional.toLowerCase() === who.toLowerCase()))
    .sort((a, b) => a.booking_time.localeCompare(b.booking_time));

  const cancel = async (id: string) => {
    setBusy(id);
    await supabase.from("bookings").delete().eq("id", id);
    setBusy(null);
    onChange();
  };

  const [y, m, d] = day.split("-").map(Number);
  const dateObj = new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1);

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="dia" className="mb-1.5 block text-xs font-bold uppercase text-muted-foreground">
            Dia
          </label>
          <input
            id="dia"
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        {isOwner && (
          <div>
            <label htmlFor="quem" className="mb-1.5 block text-xs font-bold uppercase text-muted-foreground">
              Barbeiro
            </label>
            <select
              id="quem"
              value={who}
              onChange={(e) => setWho(e.target.value)}
              className="rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="todos">Todos</option>
              {team.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <button
          onClick={() => setShowForm((v) => !v)}
          className="ml-auto flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 font-display text-sm font-extrabold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" /> Novo agendamento
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        {formatDateBR(day)} · {WEEKDAYS_FULL[dateObj.getDay()]} · {dayBookings.length} atendimento(s)
      </p>

      {showForm && (
        <NovoAgendamento
          me={me}
          isOwner={isOwner}
          team={team}
          day={day}
          bookings={bookings}
          onDone={() => {
            setShowForm(false);
            onChange();
          }}
        />
      )}

      {dayBookings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
          Nenhum agendamento nesse dia.
        </div>
      ) : (
        <div className="grid gap-3">
          {dayBookings.map((b) => (
            <div key={b.id} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-display text-lg font-extrabold text-primary">
                  {b.booking_time.slice(0, 5)}
                </p>
                <button
                  onClick={() => cancel(b.id)}
                  disabled={busy === b.id}
                  className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                >
                  {busy === b.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                  Desmarcar
                </button>
              </div>
              <div className="grid gap-1 text-sm">
                <Line label="Serviço" value={b.service} />
                <Line label="Barbeiro" value={b.professional} />
                <Line label="Cliente" value={b.client_name} />
                <Line label="Telefone" value={b.client_phone} />
                {b.client_email && <Line label="E-mail" value={b.client_email} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NovoAgendamento({
  me,
  isOwner,
  team,
  day,
  bookings,
  onDone,
}: {
  me: BarberRow;
  isOwner: boolean;
  team: BarberRow[];
  day: string;
  bookings: Booking[];
  onDone: () => void;
}) {
  const [service, setService] = useState(SERVICES[0]?.name ?? "");
  const [professional, setProfessional] = useState(me.name);
  const [date, setDate] = useState(day);
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<ScheduleRow | null>(null);

  const barber = team.find((b) => b.name === professional) ?? me;
  const [yy, mm, dd] = date.split("-").map(Number);
  const dateObj = new Date(yy ?? 2026, (mm ?? 1) - 1, dd ?? 1);

  useEffect(() => {
    let alive = true;
    supabase
      .from("barber_schedules")
      .select("id, barber_id, weekday, works, start_time, end_time, lunch_start, lunch_end")
      .eq("barber_id", barber.id)
      .eq("weekday", dateObj.getDay())
      .maybeSingle()
      .then(({ data }) => {
        if (alive) setSchedule((data as ScheduleRow) ?? null);
      });
    return () => {
      alive = false;
    };
  }, [barber.id, date]);

  const slots = slotsForBarber(dateObj, schedule);
  const taken = bookings
    .filter((b) => b.booking_date === date && b.professional === professional)
    .map((b) => b.booking_time.slice(0, 5));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from("bookings").insert({
      service,
      professional,
      barber_id: barber.id,
      booking_date: date,
      booking_time: time,
      client_name: name.trim(),
      client_phone: phone.trim(),
    });
    setSaving(false);
    if (err) {
      setError(
        err.code === "23505"
          ? "Já existe um agendamento nesse horário."
          : "Não foi possível salvar o agendamento."
      );
      return;
    }
    onDone();
  };

  return (
    <form onSubmit={save} className="grid gap-4 rounded-xl border border-border bg-card p-4">
      <p className="font-display font-bold">Novo agendamento</p>
      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
          {error}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
        >
          {SERVICES.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name} — R$ {s.price}
            </option>
          ))}
        </select>
        <select
          value={professional}
          onChange={(e) => setProfessional(e.target.value)}
          disabled={!isOwner}
          className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-60"
        >
          {(isOwner ? team : [me]).map((b) => (
            <option key={b.id} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
        <select
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
          className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="">Horário</option>
          {slots.map((s) => (
            <option key={s} value={s} disabled={taken.includes(s)}>
              {s} {taken.includes(s) ? "(ocupado)" : ""}
            </option>
          ))}
        </select>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Nome do cliente"
          className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          placeholder="Telefone"
          className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>
      <button
        type="submit"
        disabled={saving || !time}
        className="rounded-xl bg-primary py-3 font-display text-sm font-extrabold text-primary-foreground disabled:opacity-40"
      >
        {saving ? "Salvando..." : "Marcar atendimento"}
      </button>
    </form>
  );
}

/* ---------------- Horários ---------------- */

function HorariosTab({
  barberId,
  schedules,
  onChange,
}: {
  barberId: string;
  schedules: ScheduleRow[];
  onChange: () => void;
}) {
  const [rows, setRows] = useState<ScheduleRow[]>(() =>
    Array.from({ length: 7 }, (_, weekday) => {
      const found = schedules.find((s) => s.weekday === weekday);
      return (
        found ?? {
          barber_id: barberId,
          weekday,
          works: false,
          start_time: "09:00",
          end_time: "20:00",
          lunch_start: null,
          lunch_end: null,
        }
      );
    })
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = (weekday: number, patch: Partial<ScheduleRow>) => {
    setRows((prev) => prev.map((r) => (r.weekday === weekday ? { ...r, ...patch } : r)));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    await supabase.from("barber_schedules").upsert(
      rows.map((r) => ({
        barber_id: barberId,
        weekday: r.weekday,
        works: r.works,
        start_time: toHHMM(r.start_time) || "09:00",
        end_time: toHHMM(r.end_time) || "20:00",
        lunch_start: toHHMM(r.lunch_start) || null,
        lunch_end: toHHMM(r.lunch_end) || null,
      })),
      { onConflict: "barber_id,weekday" }
    );
    setSaving(false);
    setSaved(true);
    onChange();
  };

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        Marque os dias em que você trabalha e ajuste seus horários. Os clientes só veem horários
        dentro do funcionamento da barbearia ({SHOP.hoursText}).
      </p>

      <div className="grid gap-3">
        {rows.map((r) => (
          <div key={r.weekday} className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display font-bold">{WEEKDAY_LABELS[r.weekday]}</p>
              <button
                onClick={() => update(r.weekday, { works: !r.works })}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                  r.works
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                {r.works ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                {r.works ? "Trabalha" : "Folga"}
              </button>
            </div>
            {r.works && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <TimeField
                  label="Início"
                  value={toHHMM(r.start_time)}
                  onChange={(v) => update(r.weekday, { start_time: v })}
                />
                <TimeField
                  label="Fim"
                  value={toHHMM(r.end_time)}
                  onChange={(v) => update(r.weekday, { end_time: v })}
                />
                <TimeField
                  label="Almoço início"
                  value={toHHMM(r.lunch_start)}
                  onChange={(v) => update(r.weekday, { lunch_start: v || null })}
                />
                <TimeField
                  label="Almoço fim"
                  value={toHHMM(r.lunch_end)}
                  onChange={(v) => update(r.weekday, { lunch_end: v || null })}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="rounded-xl bg-primary py-3.5 font-display text-sm font-extrabold text-primary-foreground disabled:opacity-40"
      >
        {saving ? "Salvando..." : saved ? "Horários salvos!" : "Salvar horários"}
      </button>
    </div>
  );
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-bold uppercase text-muted-foreground">
        {label}
      </label>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </div>
  );
}

/* ---------------- Dashboard ---------------- */

function DashboardTab({ bookings }: { bookings: Booking[] }) {
  const stats = useMemo(() => {
    const today = new Date();
    const iso = formatDateISO(today);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const weekStart = formatDateISO(startOfWeek);
    const monthPrefix = iso.slice(0, 7);
    const yearPrefix = iso.slice(0, 4);

    const priceOf = (serviceName: string) =>
      SERVICES.find((s) => s.name === serviceName)?.price ?? 0;

    const group = (filter: (b: Booking) => boolean) => {
      const list = bookings.filter(filter);
      return {
        count: list.length,
        revenue: list.reduce((acc, b) => acc + priceOf(b.service), 0),
      };
    };

    return {
      dia: group((b) => b.booking_date === iso),
      semana: group((b) => b.booking_date >= weekStart && b.booking_date <= iso.slice(0, 10) === true ? true : b.booking_date >= weekStart && b.booking_date < formatDateISO(new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 7))),
      mes: group((b) => b.booking_date.startsWith(monthPrefix)),
      ano: group((b) => b.booking_date.startsWith(yearPrefix)),
    };
  }, [bookings]);

  const byMonth = useMemo(() => {
    const year = new Date().getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => ({
      label: new Date(year, i, 1).toLocaleDateString("pt-BR", { month: "short" }),
      count: bookings.filter(
        (b) => b.booking_date.startsWith(`${year}-${String(i + 1).padStart(2, "0")}`)
      ).length,
    }));
    const max = Math.max(1, ...months.map((m) => m.count));
    return { months, max };
  }, [bookings]);

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard title="Hoje" {...stats.dia} />
        <StatCard title="Esta semana" {...stats.semana} />
        <StatCard title="Este mês" {...stats.mes} />
        <StatCard title="Este ano" {...stats.ano} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 font-display text-base font-extrabold">
          Atendimentos por mês ({new Date().getFullYear()})
        </h2>
        <div className="flex h-40 items-end gap-2">
          {byMonth.months.map((m) => (
            <div key={m.label} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground">{m.count}</span>
              <div
                className="w-full rounded-t bg-primary"
                style={{ height: `${(m.count / byMonth.max) * 100}%`, minHeight: 2 }}
              />
              <span className="text-[10px] capitalize text-muted-foreground">
                {m.label.replace(".", "")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, count, revenue }: { title: string; count: number; revenue: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <p className="font-display text-3xl font-extrabold text-primary">{count}</p>
      <p className="text-xs text-muted-foreground">R$ {revenue} previstos</p>
    </div>
  );
}

/* ---------------- Equipe (dono) ---------------- */

function EquipeTab({ team, onChange }: { team: BarberRow[]; onChange: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);

  const toggle = async (b: BarberRow) => {
    setBusy(b.id);
    await supabase.from("barbers").update({ active: !b.active }).eq("id", b.id);
    setBusy(null);
    onChange();
  };

  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted-foreground">
        Libere o acesso dos barbeiros. Só barbeiros liberados aparecem para os clientes no
        agendamento.
      </p>
      {team.map((b) => (
        <div
          key={b.id}
          className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
        >
          <div>
            <p className="font-display font-bold">{b.name}</p>
            <p className="text-xs text-muted-foreground">
              {b.active ? "Liberado" : "Aguardando liberação"}
            </p>
          </div>
          <button
            onClick={() => toggle(b)}
            disabled={busy === b.id}
            className={`rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
              b.active
                ? "border-border text-muted-foreground hover:border-destructive hover:text-destructive"
                : "border-primary bg-primary text-primary-foreground"
            }`}
          >
            {busy === b.id ? "..." : b.active ? "Bloquear" : "Liberar"}
          </button>
        </div>
      ))}
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium">{value}</span>
    </p>
  );
}
