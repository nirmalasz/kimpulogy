"use client";

import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { Product } from "@/components/modals/ProductDetailModal";

type AddProductModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (product: Omit<Product, "id">) => void;
};

export function AddProductModal({ open, onClose, onAdd }: AddProductModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  const reset = () => {
    setName("");
    setCategory("");
    setPrice("");
    setStock("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name,
      category,
      price: Number(price) || 0,
      stock: Number(stock) || 0,
    });
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Tambah Produk Baru">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex aspect-[276/276] w-full items-center justify-center rounded-xl border-2 border-dashed border-fg-line bg-bg-subtle text-neutral-500">
          <span className="flex flex-col items-center gap-2 text-sm">
            <ImagePlus className="h-8 w-8" />
            Tambahkan foto produk
          </span>
        </div>
        <Input
          label="Nama Produk"
          placeholder="Masukkan nama produk"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Kategori"
            placeholder="Kategori"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />
          <Input
            label="Harga"
            type="number"
            placeholder="Rp"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <Input
          label="Stok"
          type="number"
          placeholder="Jumlah stok"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          required
        />
        <Button type="submit" size="lg" fullWidth>
          Simpan Produk
        </Button>
      </form>
    </Modal>
  );
}