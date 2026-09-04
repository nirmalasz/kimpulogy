import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col bg-bg-subtle">
        <Topbar />
        <main className="mx-auto w-full max-w-[1440px] flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}