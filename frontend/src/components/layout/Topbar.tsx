"use client";

import { useEffect, useState } from "react";
import { Bell, LogOut, Search } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getNotifications, type AppNotification } from "@/services/api";

export function Topbar() {
  const { user, shop, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getNotifications()
      .then((res) => {
        if (cancelled) return;
        setNotifs(res.notifications);
        setUnread(res.unread_count);
      })
      .catch(() => {
        /* backend down — keep empty */
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
              {unread > 0 ? (
                <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-alert-solid px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
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
                    <span className="text-xs text-neutral-500">{unread} baru</span>
                  </div>
                  <div className="flex max-h-80 flex-col overflow-y-auto">
                    {notifs.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-neutral-500">
                        Tidak ada notifikasi baru
                      </p>
                    ) : (
                      notifs.map((notif) => (
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
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-300 text-lg font-bold text-primary-500">
              {(user?.name || "Z").charAt(0).toUpperCase()}
            </span>
            <div className="hidden flex-col leading-tight sm:flex">
              <span className="font-semibold text-fg-default">
                {user?.name || "Zafran"}
              </span>
              <span className="text-sm text-neutral-500">
                {shop?.name || "Warung Mama Zafran"}
              </span>
            </div>
            <button
              type="button"
              onClick={logout}
              aria-label="Keluar"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-fg-text transition-colors hover:bg-neutral-100"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}