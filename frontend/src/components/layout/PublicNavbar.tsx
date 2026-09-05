import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/layout/Logo";

export function PublicNavbar() {
  return (
    <header className="border-b border-fg-line bg-bg-default">
      <div className="mx-auto flex h-20 w-full max-w-[1440px] items-center justify-between px-6">
        <Logo size={42} />
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#services" className="text-fg-text hover:text-primary-400">
            Services
          </a>
          <a href="#about" className="text-fg-text hover:text-primary-400">
            About
          </a>
          <a href="#contact" className="text-fg-text hover:text-primary-400">
            Contact
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" href="/signup">
            Masuk
          </Button>
          <Button href="/signup">Daftar</Button>
        </div>
      </div>
    </header>
  );
}