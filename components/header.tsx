import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="text-xl">🌱</span>
          <span>Prompt Garden</span>
        </Link>
        <nav className="flex gap-4 items-center">
          <Button variant="ghost" asChild>
            <Link href="/projects">Projects</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/prompts">Prompts</Link>
          </Button>
          <Button variant="outline">
            <Link href="/new">Create New</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
} 