"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PublicNavbar } from "@/components/layout/PublicNavbar";

export default function SignupSuccessPage() {
  const router = useRouter();

  const handleStart = () => {
    sessionStorage.removeItem("larixin-signup");
    router.push("/dashboard");
  };

  return (
    <div className="flex flex-1 flex-col">
      <PublicNavbar />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 items-center justify-center px-6 py-16">
        <section className="flex w-full max-w-[614px] flex-col items-center gap-8 text-center">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-bold font-heading text-fg-default">
              Selamat Datang!
            </h1>
            <p className="text-lg text-fg-text">
              Warung Mama Zafran sudah siap dilarisin
            </p>
          </div>
          <Button size="lg" onClick={handleStart}>
            Mulai LARISIN
          </Button>
        </section>
      </main>
    </div>
  );
}