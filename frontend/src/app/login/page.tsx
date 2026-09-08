"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { useAuth } from "@/components/auth/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Email dan password wajib diisi");
      return;
    }
    setSubmitting(true);
    setError(undefined);
    try {
      await login(email.trim(), password);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk, coba lagi");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <PublicNavbar />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 items-center px-6 py-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-10 flex flex-col gap-2">
            <h1 className="text-4xl font-bold font-heading text-fg-default">
              Selamat datang kembali!
            </h1>
            <p className="text-lg text-fg-text">
              Masuk untuk melanjutkan LARISIN
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <Input
              name="email"
              type="email"
              label="Email"
              placeholder="Masukkan email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              error={error}
            />
            <Input
              name="password"
              type="password"
              label="Password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <Button type="submit" size="lg" fullWidth disabled={submitting}>
              {submitting ? "Masuk..." : "Masuk"}
            </Button>
          </form>
          <p className="mt-6 text-center text-base text-fg-text">
            Belum punya akun?{" "}
            <Link href="/signup" className="font-semibold text-primary-400 hover:underline">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}