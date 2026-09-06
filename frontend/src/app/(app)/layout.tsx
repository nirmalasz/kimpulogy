import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { FloatingChatbot } from "@/components/chat/FloatingChatbot";
import { RequireAuth } from "@/components/auth/RequireAuth";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AppShell>
        {children}
        <FloatingChatbot />
      </AppShell>
    </RequireAuth>
  );
}