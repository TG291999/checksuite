import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="mb-4 text-4xl font-bold tracking-tight">Flowboard MVP</h1>
      <p className="mb-8 text-lg text-muted-foreground">
        Process management for recurring workflows.
      </p>

      <div className="flex gap-4">
        <Button asChild>
          <Link href="/register">Get Started</Link>
        </Button>

        <Button asChild variant="outline">
          <Link href="/login">View Demo</Link>
        </Button>
      </div>
    </div>
  );
}
