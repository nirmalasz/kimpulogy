"use client";

import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { Product } from "@/services/api";

type ProductFormValues = {
  name: string;
  category: string;
  price: string;
  cost: string;
  stock: string;
  sku: string;
  barcode: string;
  expiry_date: string;
  min_stock: string;
};

const emptyValues: ProductFormValues = {
  name: "",
  category: "",
  price: "",
  cost: "",
  stock: "",
  sku: "",
  barcode: "",
  expiry_date: "",
  min_stock: "10",
};

function fromProduct(p: Product | null | undefined): ProductFormValues {
  if (!p) return emptyValues;
  return {
    name: p.name || "",
    category: p.category || "",
    price: p.price ? String(p.price) : "",
    cost: p.cost ? String(p.cost) : "",
    stock: p.stock ? String(p.stock) : "",
    sku: p.sku || "",
    barcode: p.barcode || "",
    expiry_date: p.expiry_date || "",
    min_stock: p.min_stock ? String(p.min_stock) : "10",
  };
}

type AddProductModalProps = {
  open: boolean;
  onClose: () => void;
  initial?: Product | null;
  onSave: (payload: Partial<Product> & { name: string }) => Promise<void>;
};

export function AddProductModal({ open, onClose, initial, onSave }: AddProductModalProps) {
  const isEdit = !!initial;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Produk" : "Tambah Produk Baru"}
    >
      <ProductForm
        key={open ? initial?.id ?? "new" : "closed"}
        initial={initial}
        onCancel={onClose}
        onSave={async (payload) => {
          await onSave(payload);
          onClose();
        }}
      />
    </Modal>
  );
}

function ProductForm({
  initial,
  onCancel,
  onSave,
}: {
  initial?: Product | null;
  onCancel: () => void;
  onSave: (payload: Partial<Product> & { name: string }) => Promise<void>;
}) {
  const [values, setValues] = useState<ProductFormValues>(() => fromProduct(initial));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (field: keyof ProductFormValues) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) {
      setError("Nama produk wajib diisi");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        name: values.name.trim(),
        category: values.category.trim(),
        price: Number(values.price) || 0,
        cost: Number(values.cost) || 0,
        stock: Number(values.stock) || 0,
        sku: values.sku.trim(),
        barcode: values.barcode.trim(),
        expiry_date: values.expiry_date || "",
        min_stock: Number(values.min_stock) || 10,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan produk");
      setSaving(false);
    }
  };

  const isEdit = !!initial;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex aspect-[276/180] w-full items-center justify-center rounded-xl border-2 border-dashed border-fg-line bg-bg-subtle text-neutral-500">
        <span className="flex flex-col items-center gap-2 text-sm">
          <ImagePlus className="h-8 w-8" />
          {isEdit ? "Ganti foto produk" : "Tambahkan foto produk"}
        </span>
      </div>

      {error ? (
        <p className="rounded-lg bg-alert-bg p-3 text-sm text-alert-text">{error}</p>
      ) : null}

      <Input
        label="Nama Produk"
        placeholder="Masukkan nama produk"
        value={values.name}
        onChange={set("name")}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Kategori"
          placeholder="Kategori"
          value={values.category}
          onChange={set("category")}
        />
        <Input
          label="Harga Jual"
          type="number"
          placeholder="Rp"
          value={values.price}
          onChange={set("price")}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Harga Modal (Cost)"
          type="number"
          placeholder="Rp"
          value={values.cost}
          onChange={set("cost")}
        />
        <Input
          label="Stok"
          type="number"
          placeholder="Jumlah stok"
          value={values.stock}
          onChange={set("stock")}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="SKU"
          placeholder="Contoh: MGB-2477-14"
          value={values.sku}
          onChange={set("sku")}
        />
        <Input
          label="Barcode"
          placeholder="Kode barcode"
          value={values.barcode}
          onChange={set("barcode")}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Tanggal Kedaluwarsa"
          type="date"
          value={values.expiry_date}
          onChange={set("expiry_date")}
        />
        <Input
          label="Stok Minimum"
          type="number"
          placeholder="10"
          value={values.min_stock}
          onChange={set("min_stock")}
        />
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" size="lg" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" size="lg" fullWidth disabled={saving}>
          {saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Produk"}
        </Button>
      </div>
    </form>
  );
}