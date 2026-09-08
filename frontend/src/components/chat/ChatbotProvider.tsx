"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { clearChatbotSession, sendChatbotMessage } from "@/services/api";

export type ChatMessage = {
  role: "user" | "bot";
  text: string;
};

type ChatbotContextValue = {
  messages: ChatMessage[];
  sending: boolean;
  sendMessage: (text: string) => Promise<void>;
  resetConversation: () => void;
};

const CHAT_MESSAGES_KEY = "larisin_chat_messages";
const initialMessages: ChatMessage[] = [
  {
    role: "bot",
    text: "Halo! Saya Ari, asisten LARISIN. Tanya soal stok, omzet, restock, atau pesanan warung kamu.",
  },
];

const ChatbotContext = createContext<ChatbotContextValue | null>(null);

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<ChatMessage>;
  return (
    (message.role === "user" || message.role === "bot") &&
    typeof message.text === "string"
  );
}

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [sending, setSending] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof window !== "undefined") {
        try {
          const stored = JSON.parse(window.sessionStorage.getItem(CHAT_MESSAGES_KEY) ?? "null");
          if (!cancelled && Array.isArray(stored) && stored.every(isChatMessage)) {
            setMessages(stored);
          }
        } catch {
          window.sessionStorage.removeItem(CHAT_MESSAGES_KEY);
        }
      }
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (hydrated && typeof window !== "undefined") {
      window.sessionStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messages));
    }
  }, [hydrated, messages]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setSending(true);
    try {
      const response = await sendChatbotMessage(trimmed);
      setMessages((prev) => [...prev, { role: "bot", text: response.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: err instanceof Error ? err.message : "Kendala menghubungi Ari, coba lagi.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const resetConversation = () => {
    setMessages(initialMessages);
    clearChatbotSession();
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(CHAT_MESSAGES_KEY);
    }
  };

  return (
    <ChatbotContext.Provider value={{ messages, sending, sendMessage, resetConversation }}>
      {children}
    </ChatbotContext.Provider>
  );
}

export function useChatbot() {
  const context = useContext(ChatbotContext);
  if (!context) throw new Error("useChatbot must be used within ChatbotProvider");
  return context;
}
