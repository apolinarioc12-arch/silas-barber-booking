import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Lock, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SHOP } from "@/lib/barbershop";
import logoAsset from "@/assets/logo-barbearia-silas.png.asset.json";

export const Route = createFileRoute("/barbeiro")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Área do barbeiro — Barbearia Silas" },
      {
        name: "description",
        content:
          "Acesso restrito da equipe da Barbearia Silas: agenda, horários de trabalho e painel de atendimentos.",
      },
      { property: "og:title", content: "Área do barbeiro — Barbearia Silas" },
      {
        property: "og:description",
        content: "Acesso restrito da equipe da Barbearia Silas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BarberAuthPage,
});

function BarberAuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"entrar" | "criar">("entrar");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/painel", replace: true });
    });
  }, [navigate]);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    if (mode === "criar") {
      const { data, error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: window.location.origin + "/barbeiro" },
      });
      if (err) {
        setError(traduz(err.message));
        setLoading(false);
        return;
      }
      if (!data.session) {
        setInfo("Conta criada. Confirme o e-mail para entrar.");
        setLoading(false);
        return;
      }
      const { error: rpcErr } = await supabase.rpc("claim_barber_account", {
        p_name: name.trim(),
      });
      setLoading(false);
      if (rpcErr) {
        setError("Conta criada, mas não foi possível registrar o barbeiro. Fale com o dono.");
        return;
      }
      navigate({ to: "/painel", replace: true });
      return;
    }

    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (err) {
      setError(traduz(err.message));
      return;
    }
    navigate({ to: "/painel", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-4">
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
              <p className="text-xs text-muted-foreground">Área da equipe</p>
            </div>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
          >
            <ChevronLeft className="size-3.5" /> Início
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pb-16 pt-10">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="size-5" />
          </span>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            {mode === "entrar" ? "Entrar na sua conta" : "Criar conta de barbeiro"}
          </h1>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-4 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
            {info}
          </div>
        )}

        <form onSubmit={handle} className="grid gap-4">
          {mode === "criar" && (
            <Field label="Seu nome" id="nome">
              <input
                id="nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ex.: Silas"
                className="w-full rounded-lg border border-input bg-card px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </Field>
          )}
          <Field label="E-mail" id="email">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="voce@email.com"
              className="w-full rounded-lg border border-input bg-card px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </Field>
          <Field label="Senha" id="senha">
            <input
              id="senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              className="w-full rounded-lg border border-input bg-card px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </Field>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-primary py-4 font-display text-base font-extrabold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {loading ? <Loader2 className="size-5 animate-spin" /> : null}
            {mode === "entrar" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "entrar" ? "criar" : "entrar");
            setError(null);
            setInfo(null);
          }}
          className="mt-6 w-full text-center text-sm text-muted-foreground hover:text-primary"
        >
          {mode === "entrar"
            ? "Ainda não tem conta? Criar conta de barbeiro"
            : "Já tem conta? Entrar"}
        </button>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Novas contas precisam ser liberadas pelo dono da barbearia antes de aparecer para os
          clientes.
        </p>
      </main>
    </div>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

function traduz(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos.";
  if (/already registered/i.test(msg)) return "Esse e-mail já tem conta. Faça login.";
  if (/password/i.test(msg) && /short|least/i.test(msg))
    return "A senha precisa ter pelo menos 6 caracteres.";
  if (/pwned|compromised/i.test(msg)) return "Essa senha é muito comum. Escolha outra.";
  return msg;
}
