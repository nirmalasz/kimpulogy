import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { FloatingChatbot } from "@/components/chat/FloatingChatbot";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      {children}
      <FloatingChatbot />
    </AppShell>
  );
}