"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { SignupIllustration } from "@/components/illustrations/Illustrations";

type FormValues = {
  namaWarung: string;
  email: string;
  password: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.namaWarung.trim()) {
    errors.namaWarung = "Nama warung wajib diisi";
  }
  if (!values.email.trim()) {
    errors.email = "Email wajib diisi";
  } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
    errors.email = "Format email tidak valid";
  }
  if (!values.password) {
    errors.password = "Password wajib diisi";
  } else if (values.password.length < 6) {
    errors.password = "Password minimal 6 karakter";
  }
  return errors;
}

export default function SignupPage() {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>({
    namaWarung: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = (field: keyof FormValues) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      sessionStorage.setItem(
        "larixin-signup",
        JSON.stringify(values),
      );
      router.push("/signup/otp");
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <PublicNavbar />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 items-center px-6 py-16">
        <div className="grid w-full items-center gap-12 lg:grid-cols-2">
          <section className="w-full max-w-[680px]">
            <div className="mb-10 flex flex-col gap-2">
              <h1 className="text-4xl font-bold font-heading text-fg-default">
                Ayo buat akun!
              </h1>
              <p className="text-lg text-fg-text">
                Lengkapi informasi berikut untuk melanjutkan
              </p>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <Input
                name="namaWarung"
                label="Nama Warung"
                placeholder="Masukkan nama warung"
                value={values.namaWarung}
                onChange={handleChange("namaWarung")}
                error={errors.namaWarung}
                autoComplete="organization"
              />
              <Input
                name="email"
                type="email"
                label="Email"
                placeholder="Masukkan email"
                value={values.email}
                onChange={handleChange("email")}
                error={errors.email}
                autoComplete="email"
              />
              <Input
                name="password"
                type="password"
                label="Password"
                placeholder="Masukkan password"
                value={values.password}
                onChange={handleChange("password")}
                error={errors.password}
                autoComplete="new-password"
              />
              <Button type="submit" size="lg" fullWidth>
                Daftarkan akun
              </Button>
            </form>
          </section>
          <SignupIllustration className="hidden lg:block" />
        </div>
      </main>
    </div>
  );
}