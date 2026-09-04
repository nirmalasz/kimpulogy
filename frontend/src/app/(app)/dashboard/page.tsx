"use client";

import { useEffect, useState } from "react";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Wallet,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatCard, type StatCardProps } from "@/components/ui/StatCard";
import {
  getDashboardMetrics,
  type DashboardMetrics,
} from "@/services/api";

function formatRupiah(value: number) {
  return "Rp " + Math.round(value).toLocaleString("id-ID");
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err?.message || "Gagal memuat metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const stats: StatCardProps[] = metrics
    ? [
        {
          icon: <ShoppingCart className="h-6 w-6" />,
          label: "Total Pesanan",
          value: String(metrics.total_orders),
          trend: "+12%",
        },
        {
          icon: <Wallet className="h-6 w-6" />,
          label: "Total Omzet",
          value: formatRupiah(metrics.total_omzet),
          trend: "+8%",
        },
        {
          icon: <Package className="h-6 w-6" />,
          label: "Stok Menipis",
          value: String(metrics.low_stock_count),
          trend: metrics.low_stock_count > 0 ? "Perlu restock" : "Stok aman",
          trendDirection: metrics.low_stock_count > 0 ? "down" : "up",
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-fg-default">
            Dashboard
          </h1>
          <p className="text-sm text-neutral-500">
            Ringkasan omzet, pesanan warung, dan produk per hari ini
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={loadMetrics}
          title="Refresh Data"
          aria-label="Refresh Data"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl bg-alert-bg p-4 text-sm text-alert-text">
          <span>Backend belum aktif atau gagal dihubungi ({error}).</span>
          <Button size="sm" variant="secondary" onClick={loadMetrics}>
            Coba Lagi
          </Button>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {loading && !metrics
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse h-28 bg-neutral-200/50" />
            ))
          : stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-heading text-fg-default">
              Pesanan Terbaru
            </h2>
            <TrendingUp className="h-5 w-5 text-primary-400" />
          </div>
          <div className="flex flex-col">
            {metrics?.recent_orders && metrics.recent_orders.length > 0 ? (
              metrics.recent_orders.map((order, index) => (
                <div
                  key={order.id}
                  className={[
                    "flex items-center justify-between gap-4 py-3",
                    index < metrics.recent_orders.length - 1
                      ? "border-b border-fg-line"
                      : "",
                  ].join(" ")}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-fg-default">
                      {order.item}
                    </span>
                    <span className="text-sm text-neutral-500">
                      {order.id} · {order.qty} item
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-fg-default">
                      {order.total}
                    </span>
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-sm font-semibold",
                        order.status === "Selesai"
                          ? "bg-success-bg text-success-text"
                          : order.status === "Diproses"
                            ? "bg-info-bg text-info-text"
                            : "bg-warning-bg text-warning-text",
                      ].join(" ")}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-sm text-neutral-500">
                Belum ada pesanan masuk
              </div>
            )}
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold font-heading text-fg-default">
            Aktivitas Penjualan Warung
          </h2>
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl bg-tertiary-100 p-8 text-center">
            <div className="text-2xl font-bold font-heading text-fg-default">
              {metrics ? `${metrics.products_sold} Porsi Terjual` : "0 Terjual"}
            </div>
            <p className="mt-2 text-sm text-fg-text max-w-sm">
              Pesanan lancar dan perputaran kas tercatat secara real-time ke sistem kasir LARISIN.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}