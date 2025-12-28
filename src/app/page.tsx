import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, ChevronDown, LayoutTemplate, ListTodo, Shield, Users, Zap, Menu, FileText, BarChart3, Clock, Lock } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export const metadata = {
  title: "CheckSuite - Struktur, die bleibt.",
  description: "CheckSuite bringt Ordnung in wiederkehrende Prozesse – mit Pflicht-Checklisten, Vorlagen und klaren Verantwortlichkeiten.",
  openGraph: {
    title: "CheckSuite - Struktur, die bleibt.",
    description: "Ordnung für wiederkehrende Prozesse. Jetzt kostenlos starten.",
    url: "https://checksuite.de",
    siteName: "CheckSuite",
    locale: "de_DE",
    type: "website",
  },
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 font-sans">

      {/* --- NAVIGATION --- */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6D28D9] text-white">
              <Check className="h-5 w-5" strokeWidth={3} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">CheckSuite</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
            <Link href="#features" className="hover:text-[#6D28D9] transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-[#6D28D9] transition-colors">So geht's</Link>
            <Link href="#pricing" className="hover:text-[#6D28D9] transition-colors">Preise</Link>
            <Link href="#faq" className="hover:text-[#6D28D9] transition-colors">FAQ</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:block">
              Login
            </Link>
            <Button asChild className="bg-[#6D28D9] hover:bg-[#5b21b6] text-white">
              <Link href="https://app.checksuite.de/signup">Jetzt starten</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* --- HERO SECTION --- */}
        <section className="relative overflow-hidden pt-20 pb-32 lg:pt-32 lg:pb-40">
          <div className="container px-4 md:px-6 mx-auto text-center max-w-4xl">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl mb-6">
              Struktur, die <span className="text-[#6D28D9]">bleibt.</span>
            </h1>
            <p className="mx-auto max-w-[700px] text-lg text-slate-600 md:text-xl mb-10 leading-relaxed">
              CheckSuite bringt Ordnung in wiederkehrende Prozesse – mit Pflicht-Checklisten, Vorlagen und klaren Verantwortlichkeiten.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="h-12 px-8 text-base bg-[#6D28D9] hover:bg-[#5b21b6]">
                <Link href="https://app.checksuite.de/signup">Jetzt starten <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900">
                <Link href="#pricing">Preise ansehen</Link>
              </Button>
            </div>

            {/* Social Proof / Trust (Optional Placeholder) */}
            <div className="mt-12 text-sm text-slate-400 font-medium">
              Perfekt für Teams, die endlich Ordnung brauchen.
            </div>
          </div>
        </section>

        {/* --- PROBLEM SECTION --- */}
        <section className="py-20 bg-slate-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Kennst du das Chaos?
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Warum gute Teams an schlechten Prozessen scheitern.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                  <FileText className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Zettelwirtschaft & Excel</h3>
                <p className="text-slate-600 leading-relaxed">
                  Informationen sind verstreut. Keiner weiß, wo der aktuelle Stand zu finden ist.
                </p>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                  <ListTodo className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Vergessene Schritte</h3>
                <p className="text-slate-600 leading-relaxed">
                  Wichtige Details gehen unter, weil Prozesse nur in den Köpfen der Mitarbeiter existieren.
                </p>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="h-12 w-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-6">
                  <Users className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Keine Verantwortung</h3>
                <p className="text-slate-600 leading-relaxed">
                  "Ich dachte, du machst das." Aufgabendelegation ohne klares System führt zu Frust.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --- FEATURES SECTION --- */}
        <section id="features" className="py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Die Lösung: CheckSuite
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Einfach, strukturiert und ohne Schnickschnack. Alles, was du brauchst, um Prozesse zu meistern.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: LayoutTemplate,
                  title: "Prozesse als Templates",
                  desc: "Erstelle Vorlagen für wiederkehrende Aufgaben. Einmal definiert, immer perfekt ausgeführt."
                },
                {
                  icon: Shield,
                  title: "Pflicht-Checklisten",
                  desc: "Stelle sicher, dass nichts vergessen wird. Aufgaben können erst abgeschlossen werden, wenn alles abgehakt ist."
                },
                {
                  icon: Users,
                  title: "Klare Verantwortlichkeiten",
                  desc: "Jeder Schritt hat einen Besitzer. Weise Aufgaben präzise zu und vermeide Missverständnisse."
                },
                {
                  icon: BarChart3,
                  title: "Status & Übersicht",
                  desc: "Visuelle Kanban-Boards zeigen dir sofort, wo es hakt und was als nächstes ansteht."
                },
                {
                  icon: Clock,
                  title: "Wiederkehrende Vorgänge",
                  desc: "Starte Routineprozesse auf Knopfdruck. Perfekt für Onboarding, Monatsabschlüsse oder Wartung."
                },
                {
                  icon: Zap,
                  title: "Extrem einfach",
                  desc: "Kein tagelanges Setup. Startbereit in wenigen Minuten. Keine Schulung notwendig."
                }
              ].map((feature, i) => (
                <div key={i} className="group p-8 rounded-2xl border border-slate-200 hover:border-[#6D28D9]/30 hover:shadow-lg transition-all bg-white">
                  <div className="h-12 w-12 bg-slate-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#6D28D9]/10 transition-colors">
                    <feature.icon className="h-6 w-6 text-slate-700 group-hover:text-[#6D28D9] transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- HOW IT WORKS --- */}
        <section id="how-it-works" className="py-24 bg-slate-900 text-white">
          <div className="container px-4 md:px-6 mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-16">
              So funktioniert’s
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {/* Connector Line (Desktop) */}
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-700 -z-10" />

              {[
                { step: "1", title: "Prozess anlegen", desc: "Definiere den Ablauf einmalig als Vorlage." },
                { step: "2", title: "Checklisten definieren", desc: "Lege fest, was genau erledigt werden muss." },
                { step: "3", title: "Sauber arbeiten", desc: "Starte bei jedem Vorgang eine perfekte Kopie." }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="h-24 w-24 rounded-full bg-slate-800 border-4 border-slate-900 flex items-center justify-center text-3xl font-bold mb-6 text-[#6D28D9]">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-slate-400 max-w-xs">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- TARGET AUDIENCE --- */}
        <section className="py-24 border-b border-slate-100">
          <div className="container px-4 md:px-6 mx-auto text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl mb-12">
              Gemacht für Profis, die Ergebnisse liefern
            </h2>
            <div className="flex flex-wrap justify-center gap-4 md:gap-8">
              {["Hausverwaltungen", "Agenturen", "Kanzleien", "Handwerksbetriebe"].map((tag) => (
                <span key={tag} className="px-6 py-3 rounded-full bg-slate-100 text-slate-700 font-medium text-lg">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* --- PRICING --- */}
        <section id="pricing" className="py-24 bg-slate-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Einfache Preise. Keine Überraschungen.
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Wähle das Paket, das zu deinem Team passt.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Starter */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-xl font-semibold text-slate-900">Starter</h3>
                <div className="mt-4 flex items-baseline text-slate-900">
                  <span className="text-4xl font-bold tracking-tight">0€</span>
                  <span className="ml-1 text-xl font-semibold text-slate-500">/Monat</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">Für Einzelkämpfer & zum Testen.</p>
                <ul className="mt-8 space-y-4 text-sm text-slate-600">
                  <li className="flex gap-3"><Check className="h-5 w-5 text-[#6D28D9] shrink-0" /> 1 Benutzer</li>
                  <li className="flex gap-3"><Check className="h-5 w-5 text-[#6D28D9] shrink-0" /> 3 aktive Boards</li>
                  <li className="flex gap-3"><Check className="h-5 w-5 text-[#6D28D9] shrink-0" /> Basis-Templates</li>
                </ul>
                <Button asChild className="mt-8 w-full bg-slate-900 hover:bg-slate-800">
                  <Link href="https://app.checksuite.de/signup">Kostenlos starten</Link>
                </Button>
              </div>

              {/* Team */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-[#6D28D9] relative transform md:-translate-y-4">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#6D28D9] text-white text-xs font-bold rounded-full uppercase tracking-wide">
                  Meistgenutzt
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Team</h3>
                <div className="mt-4 flex items-baseline text-slate-900">
                  <span className="text-4xl font-bold tracking-tight">29€</span>
                  <span className="ml-1 text-xl font-semibold text-slate-500">/Monat</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">Für wachsende Unternehmen.</p>
                <ul className="mt-8 space-y-4 text-sm text-slate-600">
                  <li className="flex gap-3"><Check className="h-5 w-5 text-[#6D28D9] shrink-0" /> Bis zu 10 Benutzer</li>
                  <li className="flex gap-3"><Check className="h-5 w-5 text-[#6D28D9] shrink-0" /> Unbegrenzte Boards</li>
                  <li className="flex gap-3"><Check className="h-5 w-5 text-[#6D28D9] shrink-0" /> Erweiterte Rechte</li>
                  <li className="flex gap-3"><Check className="h-5 w-5 text-[#6D28D9] shrink-0" /> Priorisierter Support</li>
                </ul>
                <Button asChild className="mt-8 w-full bg-[#6D28D9] hover:bg-[#5b21b6]">
                  <Link href="https://app.checksuite.de/signup">Jetzt wechseln</Link>
                </Button>
              </div>

              {/* Business */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-xl font-semibold text-slate-900">Business</h3>
                <div className="mt-4 flex items-baseline text-slate-900">
                  <span className="text-4xl font-bold tracking-tight">99€</span>
                  <span className="ml-1 text-xl font-semibold text-slate-500">/Monat</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">Maximale Power & Sicherheit.</p>
                <ul className="mt-8 space-y-4 text-sm text-slate-600">
                  <li className="flex gap-3"><Check className="h-5 w-5 text-[#6D28D9] shrink-0" /> Unbegrenzte Benutzer</li>
                  <li className="flex gap-3"><Check className="h-5 w-5 text-[#6D28D9] shrink-0" /> Alles aus Team</li>
                  <li className="flex gap-3"><Check className="h-5 w-5 text-[#6D28D9] shrink-0" /> Audit-Logs</li>
                  <li className="flex gap-3"><Check className="h-5 w-5 text-[#6D28D9] shrink-0" /> Persönliches Onboarding</li>
                </ul>
                <Button asChild className="mt-8 w-full bg-slate-100 text-slate-900 hover:bg-slate-200">
                  <Link href="https://app.checksuite.de/signup">Kontaktieren</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* --- FAQ --- */}
        <section id="faq" className="py-24">
          <div className="container px-4 md:px-6 mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight text-center text-slate-900 sm:text-4xl mb-12">
              Häufige Fragen
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {[
                { q: "Wie lange dauert das Setup?", a: "Weniger als 5 Minuten. Account erstellen, Team einladen, loslegen. Unsere Vorlagen helfen dir beim Schnellstart." },
                { q: "Kann ich CheckSuite kostenlos testen?", a: "Ja, der Starter-Plan ist dauerhaft kostenlos. Für Team-Features bieten wir eine 14-tägige Testphase an." },
                { q: "Wie kann ich kündigen?", a: "Jederzeit monatlich per Klick im Account-Bereich. Keine versteckten Fristen." },
                { q: "Ist meine Teamgröße begrenzt?", a: "Im Starter-Plan ja. In den Team- und Business-Plänen wächst CheckSuite mit deinem Unternehmen." },
                { q: "Sind meine Daten sicher?", a: "Absolut. Wir nutzen deutsche Serverstandorte und modernste Verschlüsselung nach DSGVO-Standards." },
                { q: "Bietet ihr Support beim Einrichten?", a: "Ja, in unserem Help-Center findest du Anleitungen. Business-Kunden erhalten persönliches Onboarding." }
              ].map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left text-slate-900 font-medium">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* --- FINAL CTA --- */}
        <section className="py-24 bg-[#6D28D9] text-white text-center">
          <div className="container px-4 mx-auto">
            <h2 className="text-3xl font-bold mb-6 sm:text-4xl">
              Bereit für Ordnung?
            </h2>
            <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
              Schließe dich hunderten Teams an, die ihre Prozesse mit CheckSuite meistern.
            </p>
            <Button asChild size="lg" className="h-14 px-10 text-lg bg-white text-[#6D28D9] hover:bg-slate-100 border-none font-bold">
              <Link href="https://app.checksuite.de/signup">Kostenlos starten</Link>
            </Button>
            <p className="mt-6 text-sm text-white/60">Keine Kreditkarte erforderlich • Sofortiger Zugriff</p>
          </div>
        </section>

        {/* --- FOOTER --- */}
        <footer className="bg-slate-50 py-12 border-t border-slate-200">
          <div className="container px-4 mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">CheckSuite</span>
              <span>© {new Date().getFullYear()}</span>
            </div>
            <div className="flex gap-6">
              <Link href="/impressum" className="hover:text-slate-900">Impressum</Link>
              <Link href="/datenschutz" className="hover:text-slate-900">Datenschutz</Link>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}
