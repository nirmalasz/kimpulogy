"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { CreateTransactionPayload } from "@/services/api";

interface AddTransactionModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (payload: CreateTransactionPayload) => Promise<void>;
}

export function AddTransactionModal({
  open,
  onClose,
  onAdd,
}: AddTransactionModalProps) {
  const [type, setType] = useState<"Masuk" | "Keluar">("Masuk");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Penjualan");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!description.trim()) {
      setError("Keterangan transaksi harus diisi");
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Jumlah uang harus lebih besar dari 0");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await onAdd({
        type,
        desc: description.trim(),
        amount: numAmount,
        category,
      });
      setDescription("");
      setAmount("");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Gagal mencatat transaksi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Catat Arus Kas (Transaksi Baru)">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-lg bg-alert-bg p-3 text-sm font-medium text-alert-text">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-fg-text">
            Jenis Transaksi
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setType("Masuk");
                setCategory("Penjualan");
              }}
              className={[
                "h-11 rounded-xl border text-sm font-bold transition-all",
                type === "Masuk"
                  ? "border-success-solid bg-success-bg text-success-text"
                  : "border-fg-line bg-bg-subtle text-neutral-500",
              ].join(" ")}
            >
              + Pemasukan (Masuk)
            </button>
            <button
              type="button"
              onClick={() => {
                setType("Keluar");
                setCategory("Kulakan");
              }}
              className={[
                "h-11 rounded-xl border text-sm font-bold transition-all",
                type === "Keluar"
                  ? "border-alert-solid bg-alert-bg text-alert-text"
                  : "border-fg-line bg-bg-subtle text-neutral-500",
              ].join(" ")}
            >
              - Pengeluaran (Keluar)
            </button>
          </div>
        </div>

        <Input
          label="Keterangan"
          placeholder={
            type === "Masuk"
              ? "Misal: Penjualan seblak & es teh sore"
              : "Misal: Beli cabai & kerupuk ke pasar"
          }
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-fg-text">
            Kategori
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-11 rounded-xl border border-fg-line bg-bg-subtle px-3 text-sm text-fg-default focus:border-primary-300 focus:outline-none"
          >
            {type === "Masuk" ? (
              <>
                <option value="Penjualan">Penjualan Harian</option>
                <option value="Jasa">Jasa / Titipan</option>
                <option value="Lainnya">Pemasukan Lainnya</option>
              </>
            ) : (
              <>
                <option value="Kulakan">Kulakan / Belanja Stok</option>
                <option value="Operasional">Operasional (Gas, Plastik, Listrik)</option>
                <option value="Gaji">Upah / Tenaga Kerja</option>
                <option value="Lainnya">Pengeluaran Lainnya</option>
              </>
            )}
          </select>
        </div>

        <Input
          label="Jumlah (Rp)"
          type="number"
          placeholder="50000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Transaksi"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
