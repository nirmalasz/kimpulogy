"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
};

type ProductDetailModalProps = {
  open: boolean;
  onClose: () => void;
  product: Product | null;
};

function formatRupiah(value: number) {
  return "Rp " + value.toLocaleString("id-ID");
}

export function ProductDetailModal({
  open,
  onClose,
  product,
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product.name}
    >
      <div className="flex flex-col gap-6">
        <div className="flex aspect-[229/229] w-full items-center justify-center rounded-xl bg-tertiary-100">
          <span className="text-5xl font-bold font-heading text-tertiary-500">
            {product.name.charAt(0)}
          </span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Badge tone="primary">{product.category}</Badge>
            <span className="mt-2 text-2xl font-bold font-heading text-fg-default">
              {formatRupiah(product.price)}
            </span>
          </div>
          <Badge tone={product.stock > 10 ? "success" : "warning"}>
            Stok {product.stock}
          </Badge>
        </div>
        <div className="flex items-center gap-6">
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
        <div className="flex items-center justify-between border-t border-fg-line pt-4">
          <span className="text-base font-semibold text-fg-text">Total</span>
          <span className="text-xl font-bold font-heading text-fg-default">
            {formatRupiah(product.price * quantity)}
          </span>
        </div>
      </div>
    </Modal>
  );
}