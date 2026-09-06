"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { createSales } from "@/services/api";

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  sku?: string;
  barcode?: string;
  expiry_date?: string;
  min_stock?: number;
};

type ProductDetailModalProps = {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  onChanged?: () => void;
};

function formatRupiah(value: number) {
  return "Rp " + value.toLocaleString("id-ID");
}

export function ProductDetailModal({
  open,
  onClose,
  product,
  onChanged,
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!product) return null;

  const isLow = product.stock <= (product.min_stock || 10);

  const handleSale = async () => {
    setSaving(true);
    setError(null);
    try {
      await createSales({ items: [{ product_id: Number(product.id), qty: quantity }] });
      setDone(true);
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mencatat penjualan");
    } finally {
      setSaving(false);
    }
  };

  const close = () => {
    if (!saving) {
      setQuantity(1);
      setError(null);
      setDone(false);
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={close} title={product.name}>
      <div className="flex flex-col gap-6">
        <div className="flex aspect-[229/180] w-full items-center justify-center rounded-xl bg-tertiary-100">
          <span className="text-5xl font-bold font-heading text-tertiary-500">
            {product.name.charAt(0)}
          </span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Badge tone="primary">{product.category || "-"}</Badge>
            <span className="mt-2 text-2xl font-bold font-heading text-fg-default">
              {formatRupiah(product.price)}
            </span>
          </div>
          <Badge tone={isLow ? "warning" : "success"}>
            Stok {product.stock}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-xl bg-bg-subtle p-4 text-sm">
          <span className="text-neutral-500">SKU</span>
          <span className="text-right font-medium text-fg-default">{product.sku || "-"}</span>
          <span className="text-neutral-500">Barcode</span>
          <span className="text-right font-medium text-fg-default">{product.barcode || "-"}</span>
          <span className="text-neutral-500">Kedaluwarsa</span>
          <span className="text-right font-medium text-fg-default">{product.expiry_date || "-"}</span>
          <span className="text-neutral-500">Stok Minimum</span>
          <span className="text-right font-medium text-fg-default">{product.min_stock ?? 10}</span>
        </div>

        {done ? (
          <p className="rounded-lg bg-success-bg p-3 text-sm text-success-text">
            Penjualan tercatat! Stok terbaru dimuat ulang.
          </p>
        ) : null}
        {error ? (
          <p className="rounded-lg bg-alert-bg p-3 text-sm text-alert-text">{error}</p>
        ) : null}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold text-fg-text">Jumlah</span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Kurangi jumlah"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center text-lg font-bold text-fg-default">
                {quantity}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Tambah jumlah"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <span className="text-base font-semibold text-fg-text">
            Total{" "}
            <span className="text-xl font-bold font-heading text-fg-default">
              {formatRupiah(product.price * quantity)}
            </span>
          </span>
        </div>

        <Button size="lg" fullWidth onClick={handleSale} disabled={saving || done}>
          {saving ? "Menyimpan..." : done ? "Tersimpan" : "Catat Penjualan"}
        </Button>
      </div>
    </Modal>
  );
}