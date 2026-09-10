import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone, MapPin, Clock, Scissors, CalendarCheck, Star } from "lucide-react";
import { SHOP, SERVICES, OPENING_HOURS } from "@/lib/barbershop";
import logoAsset from "@/assets/logo-barbearia-silas.png.asset.json";
import bannerAsset from "@/assets/banner-home.webp.asset.json";
import gallery1Asset from "@/assets/gallery-1.jpg.asset.json";
import gallery2Asset from "@/assets/gallery-2.jpg.asset.json";
import gallery3Asset from "@/assets/gallery-3.jpg.asset.json";
import gallery4Asset from "@/assets/gallery-4.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Barbearia Silas — Barbearia em Diadema" },
      {
        name: "description",
        content:
          "Barbearia Silas em Diadema. Cortes modernos, barba alinhada e atendimento que faz a diferença. Agende seu horário online.",
      },
      { property: "og:title", content: "Barbearia Silas — Barbearia em Diadema" },
      {
        property: "og:description",
        content:
          "Cortes modernos, barba alinhada e atendimento que faz a diferença. Agende online na Barbearia Silas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const GALLERY = [
  { src: gallery1Asset.url, alt: "Corte moderno na Barbearia Silas" },
  { src: gallery2Asset.url, alt: "Barba alinhada na Barbearia Silas" },
  { src: gallery3Asset.url, alt: "Fade com estilo na Barbearia Silas" },
  { src: gallery4Asset.url, alt: "Atendimento na Barbearia Silas" },
];

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
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
          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/${SHOP.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary sm:flex"
            >
              <Phone className="size-3.5" />
              {SHOP.phone}
            </a>
            <Link
              to="/agendar"
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <CalendarCheck className="size-3.5" />
              Agendar
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Banner / Hero */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
            <div className="overflow-hidden rounded-2xl border border-primary/20 bg-card">
              <img
                src={bannerAsset.url}
                alt="Banner Barbearia Silas - Estilo, Confiança e Atitude"
                width={1200}
                height={600}
                className="w-full object-cover"
                style={{ aspectRatio: "1200/600" }}
              />
            </div>
            <div className="mt-6 text-center sm:mt-8">
              <Link
                to="/agendar"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-display text-sm font-extrabold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <CalendarCheck className="size-4" />
                Faça seu agendamento
              </Link>
            </div>
          </div>
        </section>

        {/* Welcome / About */}
        <section className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
          <div className="grid gap-8 sm:grid-cols-2 sm:items-center">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
                Bem-vindo
              </p>
              <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                A Barbearia Silas é o seu lugar
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Aqui a gente cuida do seu visual do jeito certo. Seja um corte descontraído, uma
                barba desenhada ou o combo completo, nossa equipe está pronta para te atender com
                profissionalismo e estilo.
              </p>
              <ul className="grid gap-3">
                <li className="flex items-center gap-3 text-sm">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Scissors className="size-4" />
                  </span>
                  Cortes e barbas feitos por quem entende do assunto
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Star className="size-4" />
                  </span>
                  Ambiente acolhedor e atendimento personalizado
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CalendarCheck className="size-4" />
                  </span>
                  Agendamento online rápido e sem complicação
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-4 font-display text-lg font-extrabold">Horário de funcionamento</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(OPENING_HOURS).map(([day, hours]) => {
                  const labels = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
                  const label = labels[Number(day)];
                  return (
                    <div key={day} className="flex justify-between">
                      <span className="text-muted-foreground">{label}</span>
                      <span className={hours ? "font-medium" : "text-muted-foreground/60"}>
                        {hours ? `${hours.open} às ${hours.close}` : "Fechado"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="border-y border-border bg-card/50">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
            <div className="mb-8 text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">Serviços</p>
              <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                O que fazemos por você
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {SERVICES.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-border bg-background p-5 transition-colors hover:border-primary"
                >
                  <p className="mb-1 font-display text-base font-bold">{s.name}</p>
                  <p className="mb-3 text-xs text-muted-foreground">~{s.durationMin} min</p>
                  <p className="font-display text-2xl font-extrabold text-primary">R$ {s.price}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                to="/agendar"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-display text-sm font-extrabold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <CalendarCheck className="size-4" />
                Agende agora
              </Link>
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
          <div className="mb-8 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">Galeria</p>
            <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              Alguns dos nossos trabalhos
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {GALLERY.map((img, i) => (
              <div
                key={i}
                className="group overflow-hidden rounded-xl border border-border bg-card"
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  width={600}
                  height={600}
                  loading="lazy"
                  className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Map */}
        <section className="border-t border-border bg-card/50">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
            <div className="mb-6 text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
                Onde estamos
              </p>
              <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                Venha nos visitar
              </h2>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border">
              <iframe
                title="Localização da Barbearia Silas"
                src="https://maps.google.com/maps?q=Barbearia+Silas,+Rua+Bituva,+240,+Eldorado,+Diadema,+SP,+09971-070&output=embed"
                width="100%"
                height={360}
                className="border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="mt-4 flex flex-col items-center gap-1 text-center text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                {SHOP.address}
              </p>
              <p className="flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                {SHOP.hoursText}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {SHOP.name}. Todos os direitos reservados.
          </p>
          <Link
            to="/agendar"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 font-display text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <CalendarCheck className="size-4" />
            Agendar horário
          </Link>
        </div>
      </footer>
    </div>
  );
}
