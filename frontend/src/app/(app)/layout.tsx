import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { FloatingChatbot } from "@/components/chat/FloatingChatbot";
import { ChatbotProvider } from "@/components/chat/ChatbotProvider";
import { RequireAuth } from "@/components/auth/RequireAuth";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <ChatbotProvider>
        <AppShell>
          {children}
          <FloatingChatbot />
        </AppShell>
      </ChatbotProvider>
    </RequireAuth>
  );
}
