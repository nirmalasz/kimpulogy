"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Home,
  LogOut,
  MessageSquareText,
  Package,
  Wallet,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/stock", label: "Stok", icon: Package },
  { href: "/finance", label: "Keuangan", icon: Wallet },
  { href: "/forecast", label: "Forecast", icon: BarChart3 },
  { href: "/chatbot", label: "Chatbot AI", icon: MessageSquareText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-[119px] shrink-0 flex-col items-center bg-primary-500 py-6 text-fg-text-contrast">
      <Link href="/" className="mb-10" aria-label="LARISIN">
        <Image src="/logo-light.png" alt="LARISIN" width={48} height={48} priority />
      </Link>
      <nav className="flex flex-col gap-4">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              className={[
                "flex h-14 w-14 items-center justify-center rounded-xl transition-colors",
                active
                  ? "bg-secondary-400 text-fg-text-contrast"
                  : "bg-transparent text-fg-text-contrast/70 hover:bg-fg-text-contrast/10",
              ].join(" ")}
            >
              <Icon className="h-6 w-6" />
            </Link>
          );
        })}
      </nav>
      <Link
        href="/"
        className="mt-auto flex h-14 w-14 items-center justify-center rounded-xl text-fg-text-contrast/70 transition-colors hover:bg-fg-text-contrast/10"
        title="Keluar"
        aria-label="Keluar"
      >
        <LogOut className="h-6 w-6" />
      </Link>
    </aside>
  );
}