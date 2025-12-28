export const metadata = {
    title: "Impressum | CheckSuite",
    description: "Rechtliche Informationen zu CheckSuite.",
}

export default function ImpressumPage() {
    return (
        <div className="container mx-auto max-w-3xl px-6 py-20 font-sans text-slate-900">
            <h1 className="text-4xl font-bold mb-8">Impressum</h1>

            <div className="prose prose-slate max-w-none">
                <p>Angaben gemäß § 5 TMG</p>

                <h3 className="mt-8 text-xl font-bold">Betreiber & Kontakt</h3>
                <p>
                    CheckSuite GmbH (Musterfirma)<br />
                    Musterstraße 123<br />
                    10115 Berlin
                </p>

                <p className="mt-4">
                    <strong>Vertreten durch:</strong><br />
                    Max Mustermann (Geschäftsführer)
                </p>

                <p className="mt-4">
                    <strong>Kontakt:</strong><br />
                    Telefon: +49 (0) 123 44 55 66<br />
                    E-Mail: kontakt@checksuite.de
                </p>

                <h3 className="mt-8 text-xl font-bold">Registereintrag</h3>
                <p>
                    Eintragung im Handelsregister.<br />
                    Registergericht: Amtsgericht Berlin-Charlottenburg<br />
                    Registernummer: HRB 12345
                </p>

                <h3 className="mt-8 text-xl font-bold">Umsatzsteuer-ID</h3>
                <p>
                    Umsatzsteuer-Identifikationsnummer gemäß §27 a Umsatzsteuergesetz:<br />
                    DE 123 456 789
                </p>

                <h3 className="mt-8 text-xl font-bold">Streitschlichtung</h3>
                <p>
                    Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
                    <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-[#6D28D9] hover:underline"> https://ec.europa.eu/consumers/odr</a>.<br />
                    Unsere E-Mail-Adresse finden Sie oben im Impressum.
                </p>

                <p className="mt-4">
                    Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
                </p>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-200">
                <a href="/" className="text-[#6D28D9] font-medium hover:underline">← Zurück zur Startseite</a>
            </div>
        </div>
    )
}
