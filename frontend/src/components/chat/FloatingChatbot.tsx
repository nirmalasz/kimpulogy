"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bot, MessageSquare, SendHorizonal, X } from "lucide-react";

type Message = {
  role: "user" | "bot";
  text: string;
};

export function FloatingChatbot() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "Halo! Saya Ari, asisten LARISIN. Mau nanya apa?",
    },
  ]);
  const [input, setInput] = useState("");

  if (pathname === "/chatbot") return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Baik, saya catat. Fitur jawaban pintar akan tersedia setelah terhubung ke model AI.",
        },
      ]);
    }, 600);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-4">
      {open ? (
        <div className="flex h-[26rem] w-80 flex-col overflow-hidden rounded-2xl border border-fg-line bg-bg-default shadow-lg">
          <div className="flex items-center justify-between bg-primary-500 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-400">
                <Bot className="h-5 w-5" />
              </span>
              <span className="font-bold font-heading text-fg-text-contrast">
                Tanya Ari!
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup chat"
              className="text-fg-text-contrast/80 hover:text-fg-text-contrast"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
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
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
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
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-fg-line p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tulis pesan..."
              className="h-10 flex-1 rounded-lg border border-fg-line bg-bg-subtle px-3 text-sm text-fg-default placeholder:text-neutral-500 focus:border-primary-300 focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Kirim pesan"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500 text-fg-text-contrast hover:bg-primary-400"
            >
              <SendHorizonal className="h-5 w-5" />
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Buka chat Ari"
        className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-500 shadow-lg transition-colors hover:bg-primary-400"
      >
        <MessageSquare className="h-7 w-7 text-secondary-600" />
      </button>
    </div>
  );
}