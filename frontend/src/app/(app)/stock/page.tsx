"use client";

import { useEffect, useState } from "react";
import { Eye, Plus, Search, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  AddProductModal,
} from "@/components/modals/AddProductModal";
import {
  ProductDetailModal,
  type Product,
} from "@/components/modals/ProductDetailModal";
import {
  getProducts,
  createProduct,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err: any) {
      setError(err?.message || "Gagal memuat produk dari server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filtered = products.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase());
    if (!matchesQuery) return false;

    if (filter === "low") {
      return p.stock > 0 && p.stock < 10;
    }
    if (filter === "empty") {
      return p.stock === 0;
    }
    return true;
  });

  const handleAdd = async (product: Omit<Product, "id">) => {
    try {
      await createProduct(product);
      await loadProducts();
      setAddOpen(false);
    } catch (err: any) {
      alert("Gagal menambahkan produk: " + err?.message);
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
            Manajemen Stok
          </h1>
          <p className="text-sm text-neutral-500">
            Katalog stok dan pergerakan persediaan warung
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={loadProducts}
            title="Refresh Data"
            aria-label="Refresh Data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-5 w-5" />
            Tambah Produk
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl bg-alert-bg p-4 text-sm text-alert-text">
          <span>Backend belum aktif atau gagal dihubungi ({error}).</span>
          <Button size="sm" variant="secondary" onClick={loadProducts}>
            Coba Lagi
          </Button>
        </div>
      )}

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
            <input
              type="search"
              placeholder="Cari produk..."
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
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 border-b border-fg-line py-3 text-sm font-semibold text-neutral-500">
            <span>Produk</span>
            <span>Kategori</span>
            <span>Harga Jual</span>
            <span>Stok</span>
            <span className="text-right">Aksi</span>
          </div>
          {loading && products.length === 0 ? (
            <div className="py-8 text-center text-neutral-500">
              Memuat data stok...
            </div>
          ) : (
            filtered.map((product, index) => (
              <div
                key={product.id}
                className={[
                  "grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-4 py-4",
                  index < filtered.length - 1 ? "border-b border-fg-line" : "",
                ].join(" ")}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-tertiary-100 font-bold text-tertiary-500">
                    {product.name.charAt(0)}
                  </span>
                  <span className="font-semibold text-fg-default">
                    {product.name}
                  </span>
                </div>
                <div>
                  <Badge tone="primary">{product.category}</Badge>
                </div>
                <span className="text-fg-text font-medium">
                  {formatRupiah(product.price)}
                </span>
                <div>
                  <Badge
                    tone={
                      product.stock === 0
                        ? "alert"
                        : product.stock < 10
                        ? "warning"
                        : "success"
                    }
                  >
                    {product.stock === 0 ? "Habis" : `${product.stock} pcs`}
                  </Badge>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleView(product)}
                    aria-label={`Lihat ${product.name}`}
                  >
                    <Eye className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))
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
        product={selected}
      />
      <AddProductModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAdd}
      />
    </div>
  );
}