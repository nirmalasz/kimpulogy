"use client";

import { useEffect, useState } from "react";
import { MapPin, Package, ShoppingCart, TrendingUp, Wallet, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatCard, type StatCardProps } from "@/components/ui/StatCard";
import { getDashboardMetrics, type DashboardMetrics } from "@/services/api";

function formatRupiah(value: number) {
  return "Rp " + Math.round(value).toLocaleString("id-ID");
}

export default function OverviewPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getDashboardMetrics();
      setMetrics(data);
    } catch {
      // Fallback gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const overviewStats: StatCardProps[] = [
    {
      icon: <ShoppingCart className="h-6 w-6" />,
      label: "Pesanan Hari Ini",
      value: metrics ? String(metrics.today_orders) : "0",
      trend: "+5",
    },
    {
      icon: <Wallet className="h-6 w-6" />,
      label: "Pemasukan",
      value: metrics ? formatRupiah(metrics.today_income) : "Rp 0",
      trend: "+15%",
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      label: "Pengeluaran",
      value: metrics ? formatRupiah(metrics.today_expense) : "Rp 0",
      trend: "-3%",
      trendDirection: "down",
    },
    {
      icon: <Package className="h-6 w-6" />,
      label: "Produk Terjual",
      value: metrics ? String(metrics.products_sold) : "0",
      trend: "+9%",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold font-heading text-fg-default">
          Overview
        </h1>
        <Button
          variant="secondary"
          onClick={loadData}
          title="Refresh Data"
          aria-label="Refresh Data"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {overviewStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="flex flex-col gap-4 xl:col-span-2">
          <h2 className="text-lg font-bold font-heading text-fg-default">
            Statistik Penjualan Harian
          </h2>
          <div className="flex flex-col justify-center rounded-xl bg-bg-subtle p-6 border border-fg-line">
            <span className="text-sm font-semibold text-fg-default mb-2">Ringkasan Kas Masuk Hari Ini</span>
            <div className="text-2xl font-bold text-success-text font-heading">
              {metrics ? formatRupiah(metrics.today_income) : "Rp 0"}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Data dikalkulasikan langsung dari transaksi dan pesanan kasir warung.
            </p>
          </div>
        </Card>
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold font-heading text-fg-default">
            Lokasi Warung
          </h2>
          <div className="flex flex-1 items-center justify-center rounded-xl bg-neutral-200 p-8 min-h-[160px]">
            <MapPin className="h-6 w-6 text-primary-400" />
            <span className="ml-2 text-sm font-semibold text-fg-text">
              Warung Kimpulogy (Aktif)
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}