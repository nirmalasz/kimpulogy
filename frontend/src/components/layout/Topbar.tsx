import { Bell, Search } from "lucide-react";

export function Topbar() {
  return (
    <header className="border-b border-fg-line bg-bg-default px-6">
      <div className="flex h-20 items-center justify-between gap-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
          <input
            type="search"
            placeholder="Cari..."
            className="h-11 w-full rounded-xl border border-fg-line bg-bg-subtle pl-11 pr-4 text-base text-fg-default placeholder:text-neutral-500 focus:border-primary-300 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-4">
          <button
            className="relative flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-fg-text"
            aria-label="Notifikasi"
          >
            <Bell className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-300 text-lg font-bold text-primary-500">
              Z
            </span>
            <div className="hidden flex-col leading-tight sm:flex">
              <span className="font-semibold text-fg-default">Zafran</span>
              <span className="text-sm text-neutral-500">Warung Mama Zafran</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}