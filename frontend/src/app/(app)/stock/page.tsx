"use client";

import { useEffect, useState } from "react";
import { Eye, Pencil, Plus, ScanLine, Search, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  AddProductModal,
} from "@/components/modals/AddProductModal";
import {
  ProductDetailModal,
  type Product as DetailProduct,
} from "@/components/modals/ProductDetailModal";
import { QuickScanModal } from "@/components/modals/QuickScanModal";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type Product,
} from "@/services/api";

function formatRupiah(value: number) {
  return "Rp " + value.toLocaleString("id-ID");
}

type FilterTab = "all" | "low" | "empty";

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [selected, setSelected] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat produk dari server");
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    setLoading(true);
    void loadProducts();
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getProducts();
        if (cancelled) return;
        setProducts(data);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Gagal memuat produk dari server");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = products.filter((p) => {
    const q = query.toLowerCase();
    const matchesQuery =
      p.name.toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q);
    if (!matchesQuery) return false;

    if (filter === "low") {
      return p.stock > 0 && p.stock <= (p.min_stock || 10);
    }
    if (filter === "empty") {
      return p.stock === 0;
    }
    return true;
  });

  const handleSave = async (payload: Partial<Product> & { name: string }) => {
    if (editProduct) {
      await updateProduct(editProduct.id, payload);
      setEditProduct(null);
    } else {
      await createProduct(payload as Omit<Product, "id">);
    }
    await loadProducts();
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Hapus produk "${product.name}"?`)) return;
    try {
      await deleteProduct(product.id);
      await loadProducts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus produk");
    }
  };

  const handleView = (product: Product) => {
    setSelected(product);
    setDetailOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-fg-default">
            Daftar Stok
          </h1>
          <p className="text-sm text-neutral-500">
            Pantau ketersediaan barang dan sesuaikan persediaan dengan kebutuhan
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={refresh}
            title="Refresh Data"
            aria-label="Refresh Data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="tertiary" onClick={() => setScanOpen(true)}>
            <ScanLine className="h-5 w-5" />
            Quick Scan
          </Button>
          <Button onClick={() => setEditProduct(null)}>
            <Plus className="h-5 w-5" />
            Tambah Produk
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl bg-alert-bg p-4 text-sm text-alert-text">
          <span>Backend belum aktif atau gagal dihubungi ({error}).</span>
          <Button size="sm" variant="secondary" onClick={refresh}>
            Coba Lagi
          </Button>
        </div>
      )}

      <Card padded={false} className="flex flex-col gap-4 border-2 border-tertiary-500 bg-tertiary-100 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
            <input
              type="search"
              placeholder="Cari produk atau SKU..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 w-full rounded-xl border border-fg-line bg-bg-subtle pl-11 pr-4 text-base text-fg-default placeholder:text-neutral-500 focus:border-primary-300 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "primary" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              Semua
            </Button>
            <Button
              variant={filter === "low" ? "primary" : "outline"}
              size="sm"
              onClick={() => setFilter("low")}
            >
              Menipis
            </Button>
            <Button
              variant={filter === "empty" ? "primary" : "outline"}
              size="sm"
              onClick={() => setFilter("empty")}
            >
              Habis
            </Button>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 rounded-t-lg bg-primary-500 px-3 py-3 text-base font-bold text-fg-text-contrast">
            <span>Produk & SKU</span>
            <span>Kategori</span>
            <span>Harga Jual</span>
            <span>Stok</span>
            <span>Kedaluwarsa</span>
            <span className="text-right">Aksi</span>
          </div>
          {loading && products.length === 0 ? (
            <div className="py-8 text-center text-neutral-500">
              Memuat data stok...
            </div>
          ) : (
            filtered.map((product, index) => {
              const isLow = product.stock <= (product.min_stock || 10);
              return (
                <div
                  key={product.id}
                  className={[
                    "grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] items-center gap-4 py-4 px-3",
                    index < filtered.length - 1 ? "border-b border-fg-line" : "",
                    product.stock === 0
                      ? "bg-alert-bg/40"
                      : isLow
                      ? "bg-warning-bg/40"
                      : "",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-tertiary-100 font-bold text-tertiary-500">
                      {product.name.charAt(0)}
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="font-semibold text-fg-default">
                        {product.name}
                      </span>
                      {product.sku ? (
                        <span className="text-xs text-neutral-500">{product.sku}</span>
                      ) : null}
                    </div>
                  </div>
                  <div>
                    <Badge tone="primary">{product.category || "-"}</Badge>
                  </div>
                  <span className="text-fg-text font-medium">
                    {formatRupiah(product.price)}
                  </span>
                  <div>
                    <Badge
                      tone={
                        product.stock === 0
                          ? "alert"
                          : isLow
                          ? "warning"
                          : "success"
                      }
                    >
                      {product.stock === 0 ? "Habis" : `${product.stock} pcs`}
                    </Badge>
                  </div>
                  <span className="text-sm text-fg-text">
                    {product.expiry_date || "-"}
                  </span>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(product)}
                      aria-label={`Lihat ${product.name}`}
                    >
                      <Eye className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditProduct(product);
                        setAddOpen(true);
                      }}
                      aria-label={`Edit ${product.name}`}
                    >
                      <Pencil className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(product)}
                      aria-label={`Hapus ${product.name}`}
                    >
                      <Trash2 className="h-5 w-5 text-alert-text" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
          {!loading && filtered.length === 0 ? (
            <p className="py-8 text-center text-neutral-500">
              Tidak ada produk yang cocok
            </p>
          ) : null}
        </div>
      </Card>

      <ProductDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        product={selected as DetailProduct | null}
        onChanged={loadProducts}
      />
      <AddProductModal
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          setEditProduct(null);
        }}
        initial={editProduct}
        onSave={handleSave}
      />
      <QuickScanModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onSaved={loadProducts}
      />
    </div>
  );
}