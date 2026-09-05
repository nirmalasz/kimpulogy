"use client";

import { useState } from "react";
import { Bell, Search } from "lucide-react";

type Notification = {
  id: number;
  title: string;
  body: string;
  time: string;
};

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    title: "Stok menipis",
    body: "Minyak Goreng Bimoli tersisa 3 pcs.",
    time: "5 menit lalu",
  },
  {
    id: 2,
    title: "Pesanan baru",
    body: "Ada pesanan baru masuk sebesar Rp 45.000.",
    time: "1 jam lalu",
  },
  {
    id: 3,
    title: "Pembayaran diterima",
    body: "Pembayaran Rp 120.000 berhasil diverifikasi.",
    time: "Kemarin",
  },
  {
    id: 4,
    title: "Stok akan kedaluwarsa",
    body: "Sirup akan segera melewati tanggal kedaluwarsa.",
    time: "Kemarin",
  },
];

export function Topbar() {
  const [notifOpen, setNotifOpen] = useState(false);

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
          <div className="relative">
            <button
              className="relative flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-fg-text transition-colors hover:bg-neutral-200"
              aria-label="Notifikasi"
              aria-expanded={notifOpen}
              onClick={() => setNotifOpen((v) => !v)}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2.5 top-2.5 flex h-2.5 w-2.5 rounded-full bg-alert-solid" />
            </button>

            {notifOpen ? (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setNotifOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-fg-line bg-bg-default shadow-lg">
                  <div className="flex items-center justify-between border-b border-fg-line px-4 py-3">
                    <span className="text-base font-bold font-heading text-fg-default">
                      Notifikasi
                    </span>
                    <span className="text-xs text-neutral-500">
                      {MOCK_NOTIFICATIONS.length} baru
                    </span>
                  </div>
                  <div className="flex max-h-80 flex-col overflow-y-auto">
                    {MOCK_NOTIFICATIONS.map((notif) => (
                      <div
                        key={notif.id}
                        className="flex gap-3 border-b border-fg-line px-4 py-3 last:border-b-0 hover:bg-bg-subtle"
                      >
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-secondary-600" />
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="text-sm font-semibold text-fg-default">
                            {notif.title}
                          </span>
                          <span className="truncate text-sm text-fg-text">
                            {notif.body}
                          </span>
                          <span className="text-xs text-neutral-500">
                            {notif.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>

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