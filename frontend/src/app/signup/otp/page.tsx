"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { OtpIllustration } from "@/components/illustrations/Illustrations";
import { useAuth } from "@/components/auth/AuthProvider";

const OTP_LENGTH = 5;
const RESEND_SECONDS = 58;

export default function OtpPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const email =
    typeof window !== "undefined"
      ? (JSON.parse(
          sessionStorage.getItem("larixin-signup") ?? "{}",
        ).email as string | undefined)
      : undefined;

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
    setError(undefined);
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const digits = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH)
      .split("");
    if (digits.length > 0) {
      setOtp([
        ...digits,
        ...Array(OTP_LENGTH - digits.length).fill(""),
      ]);
      inputsRef.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
      e.preventDefault();
    }
  };

  const handleResend = () => {
    setSeconds(RESEND_SECONDS);
    setOtp(Array(OTP_LENGTH).fill(""));
    setError(undefined);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.some((d) => !d)) {
      setError("Isi semua digit kode verifikasi");
      return;
    }
    setSubmitting(true);
    setError(undefined);
    try {
      const signup = JSON.parse(sessionStorage.getItem("larixin-signup") ?? "{}");
      await register({
        name: signup.namaWarung || "Warung",
        phone: signup.email || "",
        password: signup.password || "",
        shop_name: signup.namaWarung,
      });
      router.push("/signup/success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mendaftarkan akun, coba lagi");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <PublicNavbar />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 items-center px-6 py-16">
        <div className="grid w-full items-center gap-12 lg:grid-cols-2">
          <section className="w-full max-w-[577px]">
          <div className="mb-8 flex flex-col gap-2">
            <h1 className="text-4xl font-bold font-heading text-fg-default">
              Isi Kode Verifikasi!
            </h1>
            <p className="text-lg text-fg-text">
              Isi dengan 5 digit kode yang dikirim ke
            </p>
            <p className="flex items-center gap-2 text-base font-medium text-fg-text">
              <span className="text-primary-400">✉</span>
              {email ?? "email Anda"}
            </p>
          </div>
          <form onSubmit={handleVerify} className="flex flex-col gap-8">
            <div
              className="flex justify-between gap-3"
              onPaste={handlePaste}
            >
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputsRef.current[index] = el;
                  }}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  inputMode="numeric"
                  maxLength={1}
                  aria-label={`Digit ${index + 1}`}
                  className={[
                    "h-20 w-full rounded-xl border-2 bg-bg-default text-center text-3xl font-bold font-heading text-fg-default",
                    "focus:outline-none",
                    error
                      ? "border-alert-solid"
                      : "border-fg-line focus:border-primary-400",
                  ].join(" ")}
                />
              ))}
            </div>
            {error ? (
              <p className="text-center text-sm text-alert-text">{error}</p>
            ) : null}
            <Button type="submit" size="lg" fullWidth disabled={submitting}>
              {submitting ? "Memverifikasi..." : "Verifikasi Kode"}
            </Button>
            <p className="text-center text-sm text-fg-text">
              {seconds > 0 ? (
                <>
                  Kirim ulang dalam{" "}
                  <span className="font-semibold text-primary-400">
                    00:{String(seconds).padStart(2, "0")}
                  </span>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="font-semibold text-primary-400 hover:underline"
                >
                  Kirim ulang kode
                </button>
              )}
            </p>
          </form>
        </section>
          <OtpIllustration className="hidden lg:block" />
        </div>
      </main>
    </div>
  );
}