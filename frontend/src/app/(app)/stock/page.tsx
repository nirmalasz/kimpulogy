"use client";

import { useState } from "react";
import { Eye, Plus, Search } from "lucide-react";
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

const initialProducts: Product[] = [
  { id: "1", name: "Seblak Ceker", category: "Makanan", price: 14000, stock: 42 },
  { id: "2", name: "Indomie Goreng", category: "Makanan", price: 12000, stock: 8 },
  { id: "3", name: "Es Teh Manis", category: "Minuman", price: 3000, stock: 60 },
  { id: "4", name: "Kerupuk", category: "Camilan", price: 2000, stock: 120 },
  { id: "5", name: "Seblak Basah", category: "Makanan", price: 15000, stock: 5 },
];

function formatRupiah(value: number) {
  return "Rp " + value.toLocaleString("id-ID");
}

export default function StockPage() {
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()),
  );

  const handleAdd = (product: Omit<Product, "id">) => {
    setProducts((prev) => [
      ...prev,
      { ...product, id: String(Date.now()) },
    ]);
  };

  const handleView = (product: Product) => {
    setSelected(product);
    setDetailOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold font-heading text-fg-default">
          Manajemen Stok
        </h1>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-5 w-5" />
          Tambah Produk
        </Button>
      </div>

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
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              Semua
            </Button>
            <Button variant="outline" size="sm">
              Menipis
            </Button>
            <Button variant="outline" size="sm">
              Habis
            </Button>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 border-b border-fg-line py-3 text-sm font-semibold text-neutral-500">
            <span>Produk</span>
            <span>Kategori</span>
            <span>Harga</span>
            <span>Stok</span>
            <span className="text-right">Aksi</span>
          </div>
          {filtered.map((product, index) => (
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
              <Badge tone="primary">{product.category}</Badge>
              <span className="text-fg-text">
                {formatRupiah(product.price)}
              </span>
              <Badge
                tone={product.stock === 0 ? "alert" : product.stock < 10 ? "warning" : "success"}
              >
                {product.stock === 0 ? "Habis" : `${product.stock}`}
              </Badge>
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
          ))}
          {filtered.length === 0 ? (
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