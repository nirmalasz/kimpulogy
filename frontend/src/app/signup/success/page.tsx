"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { HelloIllustration } from "@/components/illustrations/Illustrations";
import { useAuth } from "@/components/auth/AuthProvider";

export default function SignupSuccessPage() {
  const router = useRouter();
  const { shop } = useAuth();

  const handleStart = () => {
    sessionStorage.removeItem("larixin-signup");
    router.push("/dashboard");
  };

  return (
    <div className="flex flex-1 flex-col">
      <PublicNavbar />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 items-center px-6 py-16">
        <div className="grid w-full items-center gap-12 lg:grid-cols-2">
          <section className="flex w-full max-w-[614px] flex-col items-start gap-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-5xl font-bold font-heading text-fg-default">
                Selamat Datang!
              </h1>
              <p className="text-lg text-fg-text">
                {shop?.name ?? "Warungmu"} sudah siap dilarisin
              </p>
            </div>
            <Button size="lg" onClick={handleStart}>
              Mulai LARISIN
            </Button>
          </section>
          <HelloIllustration className="hidden lg:block" />
        </div>
      </main>
    </div>
  );
}