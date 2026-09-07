"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/components/auth/AuthProvider";
import { updatePassword, updateShop, updateProfile } from "@/services/api";

export default function SettingsPage() {
  const { user, shop, setShopName, setProfile } = useAuth();

  const [shopName, setShopNameState] = useState(shop?.name ?? "");
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState<"shop" | "profile" | "password" | null>(null);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const flash = (tone: "ok" | "err", text: string) => setMsg({ tone, text });

  const saveShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving("shop");
    setMsg(null);
    try {
      await updateShop(shopName.trim());
      setShopName(shopName.trim());
      flash("ok", "Nama warung diperbarui.");
    } catch (err) {
      flash("err", err instanceof Error ? err.message : "Gagal memperbarui nama warung");
    } finally {
      setSaving(null);
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving("profile");
    setMsg(null);
    try {
      await updateProfile({ name: name.trim(), email: email.trim(), avatar_url: avatarUrl.trim() });
      setProfile(name.trim(), email.trim(), avatarUrl.trim());
      flash("ok", "Profil diperbarui.");
    } catch (err) {
      flash("err", err instanceof Error ? err.message : "Gagal memperbarui profil");
    } finally {
      setSaving(null);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      flash("err", "Password baru minimal 6 karakter");
      return;
    }
    setSaving("password");
    setMsg(null);
    try {
      await updatePassword(oldPassword, newPassword);
      setOldPassword("");
      setNewPassword("");
      flash("ok", "Password berhasil diganti.");
    } catch (err) {
      flash("err", err instanceof Error ? err.message : "Gagal mengganti password");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-4xl font-bold font-heading text-fg-default">Settings</h1>
        <p className="text-base text-neutral-500">
          Kelola profil, warung, dan keamanan akun
        </p>
      </div>

      {msg ? (
        <div
          className={[
            "rounded-xl p-3 text-sm",
            msg.tone === "ok" ? "bg-success-bg text-success-text" : "bg-alert-bg text-alert-text",
          ].join(" ")}
        >
          {msg.text}
        </div>
      ) : null}

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold font-heading text-fg-default">Profil</h2>
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="Avatar"
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary-300 text-2xl font-bold text-primary-500">
              {(user?.name || "?").charAt(0).toUpperCase()}
            </span>
          )}
          <p className="text-sm text-neutral-500">
            Avatar via URL. Upload otomatis (Cloudinary) menyusul.
          </p>
        </div>
        <form onSubmit={saveProfile} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nama" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Input
            label="Avatar URL"
            placeholder="https://..."
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
          />
          <Button type="submit" disabled={saving === "profile"}>
            {saving === "profile" ? "Menyimpan..." : "Simpan Profil"}
          </Button>
        </form>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold font-heading text-fg-default">Warung</h2>
        <form onSubmit={saveShop} className="flex flex-col gap-4">
          <Input
            label="Nama Warung"
            value={shopName}
            onChange={(e) => setShopNameState(e.target.value)}
          />
          <Button type="submit" disabled={saving === "shop"}>
            {saving === "shop" ? "Menyimpan..." : "Simpan Nama Warung"}
          </Button>
        </form>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold font-heading text-fg-default">Keamanan</h2>
        <form onSubmit={savePassword} className="flex flex-col gap-4">
          <Input
            label="Password Lama"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            autoComplete="current-password"
          />
          <Input
            label="Password Baru"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
          <Button type="submit" disabled={saving === "password"}>
            {saving === "password" ? "Menyimpan..." : "Ganti Password"}
          </Button>
        </form>
      </Card>
    </div>
  );
}