"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { getProductBySKU } from "@/services/api";

type ScannedItem = {
  id: number;
  name: string;
  sku: string;
  qty: number;
};

const MOCK_SCANNED: ScannedItem[] = [];

type QuickScanModalProps = {
  open: boolean;
  onClose: () => void;
};

export function QuickScanModal({ open, onClose }: QuickScanModalProps) {
  const [items, setItems] = useState<ScannedItem[]>(MOCK_SCANNED);
  const [sku, setSku] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  const adjustQty = (id: number, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, qty: Math.max(1, item.qty + delta) }
          : item
      )
    );
  };

  const clearAll = () => setItems([]);

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = sku.trim();
    if (!trimmed) return;
    setSearching(true);
    setLookupError(null);
    try {
      const product = await getProductBySKU(trimmed);
      const existing = items.find((i) => i.sku === product.sku);
      if (existing) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === existing.id ? { ...i, qty: i.qty + 1 } : i
          )
        );
      } else {
        setItems((prev) => [
          ...prev,
          {
            id: Date.now(),
            name: product.name,
            sku: product.sku || trimmed,
            qty: 1,
          },
        ]);
      }
      setSku("");
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : "Produk tidak ditemukan");
    } finally {
      setSearching(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Quick Scan"
      maxWidth="max-w-3xl"
    >
      <div className="grid gap-6 md:grid-cols-2">
        {/* Panel kiri: kamera + input manual */}
        <div className="flex flex-col gap-4 rounded-xl border border-tertiary-500 bg-tertiary-100 p-4">
          <div className="relative flex aspect-[16/10] w-full items-center justify-center rounded-lg border-2 border-primary-500 bg-secondary-100">
            <div className="h-[70%] w-[90%] rounded-md border border-secondary-600 bg-bg-default" />
            <span className="absolute bottom-2 text-base font-bold font-heading text-secondary-600">
              Kamera aktif
            </span>
          </div>

          <form onSubmit={handleManualAdd} className="flex items-end gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="text-base font-bold font-heading text-fg-default">
                Masukkan Manual
              </span>
              <input
                value={sku}
                onChange={(e) => {
                  setSku(e.target.value);
                  setLookupError(null);
                }}
                placeholder="Masukkan SKU"
                className="h-11 w-full rounded-lg border border-neutral-400 bg-bg-default px-3 text-sm text-fg-default placeholder:text-neutral-500 focus:border-primary-300 focus:outline-none"
              />
              {lookupError ? (
                <p className="text-sm text-alert-text">{lookupError}</p>
              ) : null}
            </div>
            <Button type="submit" size="md" className="shrink-0" disabled={searching}>
              {searching ? "Cari..." : "Masukkan"}
            </Button>
          </form>
        </div>

        {/* Panel kanan: daftar discan + footer */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col overflow-hidden rounded-lg border border-primary-500 bg-tertiary-100">
            <div className="flex items-center justify-between gap-4 border-b border-primary-500 bg-primary-100 px-3 py-2">
              <span className="text-base font-bold font-heading text-fg-default">
                Barang yang telah discan ({items.length})
              </span>
              <button
                type="button"
                onClick={clearAll}
                className="shrink-0 text-base font-bold font-heading text-fg-default"
              >
                Clear All
              </button>
            </div>

            {items.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-500">
                Belum ada barang discan
              </p>
            ) : (
              <div className="flex max-h-[19rem] flex-col overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 border-b border-primary-500 px-2 py-3 last:border-b-0"
                  >
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="truncate text-base font-bold font-heading text-fg-default">
                        {item.name}
                      </span>
                      <span className="truncate text-base text-fg-default">
                        SKU: {item.sku}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 rounded-full bg-primary-300 px-3 py-1 text-fg-text-contrast">
                      <button
                        type="button"
                        onClick={() => adjustQty(item.id, -1)}
                        aria-label={`Kurangi jumlah ${item.name}`}
                        className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-primary-400"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-6 text-center text-sm">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => adjustQty(item.id, 1)}
                        aria-label={`Tambah jumlah ${item.name}`}
                        className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-primary-400"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" size="md" onClick={onClose}>
              Batalkan
            </Button>
            <Button size="md" onClick={onClose}>
              Simpan perubahan
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}