import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="text-center max-w-2xl">
        {/* Logo / Brand */}
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground mb-6">
          Check<span className="text-primary">Suite</span>
        </h1>

        {/* Tagline */}
        <p className="text-xl sm:text-2xl text-muted-foreground leading-relaxed mb-12">
          Built to be in check.<br />
          <span className="text-foreground/80">Struktur, die bleibt.</span>
        </p>

        {/* CTA */}
        <Button asChild size="lg" className="text-base px-8 py-6 h-auto">
          <Link href="/register">Jetzt starten</Link>
        </Button>

        {/* Subtle accent line */}
        <div className="mt-16 w-24 h-1 bg-primary/20 rounded-full mx-auto" />
      </div>
    </div>
  );
}
