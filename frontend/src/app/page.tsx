import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PublicNavbar />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 items-center px-6">
        <div className="grid w-full items-center gap-12 py-16 md:grid-cols-2">
          <section id="about" className="flex flex-col gap-8">
            <h1 className="text-4xl font-bold font-heading leading-tight text-fg-default sm:text-5xl">
              Warung Makin Laris,
              <br />
              Stok Anti Habis!
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-fg-text">
              Kelola warung cukup dari satu platform, bahkan saat tidak ada
              internet.
            </p>
            <Button size="lg" href="/signup">
              Coba LARISIN sekarang!
            </Button>
          </section>
          <section
            aria-hidden="true"
            className="hidden aspect-[458/394] items-center justify-center rounded-2xl bg-tertiary-100 md:flex"
          >
            <span className="text-7xl font-bold font-heading text-tertiary-500">
              L
            </span>
          </section>
        </div>
      </main>
    </div>
  );
}