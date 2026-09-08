"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { createSales, getProducts, type Product } from "@/services/api";
import { formatQtyWithUnit, quantityStep } from "@/lib/format";

type ManualSaleItem = {
  product: Product;
  qty: number;
};

type ManualSaleModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

function formatRupiah(value: number) {
  return "Rp " + value.toLocaleString("id-ID");
}

export function ManualSaleModal({ open, onClose, onSaved }: ManualSaleModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<ManualSaleItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getProducts();
        if (!cancelled) setProducts(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Gagal memuat produk");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const visibleProducts = products.filter((product) => {
    const value = query.trim().toLowerCase();
    if (!value) return true;
    return [product.name, product.category, product.sku, product.barcode]
      .filter(Boolean)
      .some((field) => field?.toLowerCase().includes(value));
  });

  const addProduct = (product: Product) => {
    const step = quantityStep(product.unit);
    if (product.stock < step) {
      setError(`${product.name} sedang habis.`);
      return;
    }
    setError(null);
    setItems((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (!existing) return [...current, { product, qty: quantityStep(product.unit) }];
      return current.map((item) => item.product.id === product.id
        ? { ...item, qty: Math.min(item.qty + quantityStep(product.unit), product.stock) }
        : item);
    });
  };

  const adjustQuantity = (productID: string, delta: number) => {
    setItems((current) => current.map((item) => item.product.id === productID
      ? {
          ...item,
          qty: Math.max(
            quantityStep(item.product.unit),
            Math.min(item.product.stock, item.qty + delta * quantityStep(item.product.unit))
          ),
        }
      : item));
  };

  const close = () => {
    if (saving) return;
    setItems([]);
    setQuery("");
    setError(null);
    onClose();
  };

  const save = async () => {
    if (items.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await createSales({
        items: items.map((item) => ({ product_id: Number(item.product.id), qty: item.qty })),
      });
      onSaved?.();
      setSaving(false);
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mencatat penjualan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Catat Penjualan Manual" maxWidth="max-w-2xl">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama produk, kategori, SKU, atau barcode..."
            className="h-11 w-full rounded-xl border border-fg-line bg-bg-subtle pl-10 pr-3 text-sm text-fg-default focus:border-primary-300 focus:outline-none"
            autoFocus
          />
        </div>

        {error ? <p className="rounded-lg bg-alert-bg p-3 text-sm text-alert-text">{error}</p> : null}

        <div className="flex max-h-64 flex-col gap-2 overflow-y-auto rounded-xl border border-fg-line p-2">
          {loading ? <p className="p-4 text-center text-sm text-neutral-500">Memuat produk...</p> : null}
          {!loading && visibleProducts.length === 0 ? (
            <p className="p-4 text-center text-sm text-neutral-500">Produk tidak ditemukan.</p>
          ) : null}
          {visibleProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              disabled={product.stock <= 0}
              onClick={() => addProduct(product)}
              className="flex items-center justify-between gap-3 rounded-lg border border-transparent p-3 text-left hover:border-primary-300 hover:bg-bg-subtle disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-semibold text-fg-default">{product.name}</span>
                <span className="text-xs text-neutral-500">
                  {product.category || "Tanpa kategori"} · Stok {formatQtyWithUnit(product.stock, product.unit)} · {formatRupiah(product.price)}
                </span>
              </span>
              <Plus className="h-5 w-5 shrink-0 text-primary-500" />
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-semibold text-fg-default">Keranjang penjualan ({items.length})</h3>
          {items.length === 0 ? (
            <p className="rounded-lg bg-bg-subtle p-4 text-center text-sm text-neutral-500">
              Pilih produk untuk dicatat.
            </p>
          ) : items.map((item) => (
            <div key={item.product.id} className="flex items-center justify-between gap-3 rounded-lg bg-bg-subtle p-3">
              <span className="min-w-0 truncate text-sm font-medium text-fg-default">{item.product.name}</span>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => adjustQuantity(item.product.id, -1)}
                  aria-label={`Kurangi ${item.product.name}`}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-16 text-center text-sm font-bold">
                  {formatQtyWithUnit(item.qty, item.product.unit)}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={item.qty >= item.product.stock}
                  onClick={() => adjustQuantity(item.product.id, 1)}
                  aria-label={`Tambah ${item.product.name}`}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={close}>Batal</Button>
          <Button type="button" onClick={save} disabled={items.length === 0 || saving}>
            {saving ? "Menyimpan..." : "Catat Penjualan"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
