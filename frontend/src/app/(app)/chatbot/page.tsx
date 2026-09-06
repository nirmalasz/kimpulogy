"use client";

import { useRef, useState } from "react";
import { Bot, SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { sendChatbotMessage } from "@/services/api";

type Message = {
  role: "user" | "bot";
  text: string;
};

const initialMessages: Message[] = [
  {
    role: "bot",
    text: "Halo! Saya Ari, asisten LARISIN. Tanya soal stok, omzet, restock, atau pesanan warung kamu.",
  },
];

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setSending(true);

    try {
      const res = await sendChatbotMessage(text);
      setMessages((prev) => [...prev, { role: "bot", text: res.reply }]);
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

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-4xl font-bold font-heading text-fg-default">
        Tanya Ari!
      </h1>
      <Card padded={false} className="flex h-[calc(100vh-220px)] min-h-[480px] flex-col">
        <div className="flex items-center gap-3 border-b border-fg-line p-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-400">
            <Bot className="h-5 w-5" />
          </span>
          <div className="flex flex-col">
            <span className="font-bold font-heading text-fg-default">
              Asisten LARISIN
            </span>
            <span className="text-sm text-success-text">● Online</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={[
                "flex w-full",
                message.role === "user" ? "justify-end" : "justify-start",
              ].join(" ")}
            >
              <div
                className={[
                  "max-w-[70%] rounded-2xl px-4 py-3 text-base",
                  message.role === "user"
                    ? "bg-primary-500 text-fg-text-contrast rounded-br-sm"
                    : "bg-neutral-100 text-fg-default rounded-bl-sm",
                ].join(" ")}
              >
                {message.text}
              </div>
            </div>
          ))}
        </div>

        <form
          ref={formRef}
          onSubmit={handleSend}
          className="flex items-center gap-3 border-t border-fg-line p-6"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tulis pesan..."
            className="h-12 flex-1 rounded-xl border border-fg-line bg-bg-subtle px-4 text-base text-fg-default placeholder:text-neutral-500 focus:border-primary-300 focus:outline-none"
          />
          <Button type="submit" size="lg" aria-label="Kirim pesan" disabled={sending}>
            <SendHorizonal className="h-5 w-5" />
          </Button>
        </form>
      </Card>
    </div>
  );
}