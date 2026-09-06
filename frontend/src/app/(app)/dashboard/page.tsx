"use client";

import { useEffect, useState } from "react";
import { RefreshCw, ScanLine, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SalesCompareChart } from "@/components/charts/SalesCompareChart";
import { DonutChart, type DonutSlice } from "@/components/charts/DonutChart";
import { QuickScanModal } from "@/components/modals/QuickScanModal";
import {
  getDashboardAnalytics,
  type DashboardAnalytics,
} from "@/services/api";

function formatRupiah(value: number) {
  return "Rp " + Math.round(value).toLocaleString("id-ID");
}

const MIX_COLORS = ["#EA6C0C", "#FBA33C", "#354973", "#A1BD25", "#7F90BB", "#F98613", "#3D568F"];

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardAnalytics();
      setAnalytics(data);
    } catch (err: any) {
      setError(err?.message || "Gagal memuat metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const donutSlices: DonutSlice[] = (analytics?.weekly_mix || []).map((item, i) => ({
    label: item.label,
    value: item.value,
    color: MIX_COLORS[i % MIX_COLORS.length],
  }));

  const penjualanHariIni = analytics ? formatRupiah(analytics.today_income) : "Rp 666.000";
  const totalTerjualHariIni = analytics
    ? String(Math.round(analytics.this_week.reduce((sum, p) => sum + p.qty, 0)))
    : "200";
  const barangTop = analytics?.top_products?.[0]?.name || "Beras";

  const lowStock = analytics?.reminders.filter((r) => r.type === "low_stock") || [];
  const expiring = analytics?.reminders.filter((r) => r.type === "expiring") || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-bold font-heading text-fg-default">
          Mau LARISIN apa hari ini?
        </h1>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={loadAnalytics}
            title="Refresh Data"
            aria-label="Refresh Data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="tertiary" onClick={() => setScanOpen(true)}>
            <ScanLine className="h-5 w-5" />
            Quick Scan
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl bg-alert-bg p-4 text-sm text-alert-text">
          <span>Backend belum aktif atau gagal dihubungi ({error}). Menampilkan data contoh.</span>
          <Button size="sm" variant="secondary" onClick={loadAnalytics}>
            Coba Lagi
          </Button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {[
          { label: "Penjualan hari ini", value: penjualanHariIni, trend: "Naik 8%" },
          { label: "Total Terjual Hari Ini", value: totalTerjualHariIni, trend: "Naik 8%" },
          { label: "Barang Paling TOP", value: barangTop, trend: "Naik 8%" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-2 rounded-lg border-2 border-tertiary-500 bg-tertiary-100 p-4"
          >
            <span className="text-2xl font-bold font-heading text-fg-default">
              {stat.label}
            </span>
            <span className="text-2xl font-bold font-heading text-secondary-600">
              {loading && !analytics ? "…" : stat.value}
            </span>
            <span className="flex items-center gap-1 text-base text-black">
              {stat.trend}
              <TrendingUp className="h-5 w-5 text-fg-default" />
            </span>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Card padded={false} className="overflow-hidden">
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,2fr)] items-center bg-secondary-100 px-4 py-2 text-2xl font-bold font-heading text-fg-default">
            <span>Barang</span>
            <span>Terjual</span>
            <span>Keuntungan</span>
          </div>
          <div className="flex flex-col">
            {(analytics?.top_products || [
              { name: "Beras", qty: 60, profit: 100_000, profit_str: "Rp 100.000" },
              { name: "Minyak", qty: 32, profit: 72_000, profit_str: "Rp 72.000" },
              { name: "Gula", qty: 32, profit: 72_000, profit_str: "Rp 72.000" },
              { name: "Tepung", qty: 32, profit: 72_000, profit_str: "Rp 72.000" },
            ]).map((row) => (
              <div
                key={row.name}
                className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,2fr)] items-center border-t border-secondary-600 px-4 py-2.5"
              >
                <span className="text-xl text-black">{row.name}</span>
                <span className="text-xl text-black">{row.qty}</span>
                <span className="text-xl text-black">
                  {row.profit_str || formatRupiah(row.profit)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col gap-4 rounded-xl bg-neutral-200">
          <h2 className="text-lg font-semibold text-fg-default">Penjualan</h2>
          <SalesCompareChart
            thisWeek={analytics?.this_week.map((p) => p.qty)}
            lastWeek={analytics?.last_week.map((p) => p.qty)}
          />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Card className="flex flex-col gap-4 rounded-xl bg-neutral-200">
          <h2 className="text-lg font-bold font-heading text-fg-default">
            Penjualan Minggu Ini
          </h2>
          <DonutChart slices={donutSlices} />
        </Card>

        <Card className="flex flex-col gap-2 rounded-xl bg-neutral-300 p-4 opacity-80">
          <h2 className="text-2xl font-bold font-heading text-secondary-600">
            Insights
          </h2>
          <p className="text-lg text-primary-300">
            Ringkasan AI tentang performa warung kamu akan muncul di sini. Fitur
            ini segera hadir bersama asisten LARISIN.
          </p>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-xl bg-primary-100 p-4">
          <span className="text-2xl font-bold font-heading text-fg-default">
            Stok Segera Habis!
          </span>
          {lowStock.length > 0 ? (
            lowStock.slice(0, 2).map((r) => (
              <span key={r.product} className="text-4xl font-bold font-heading text-secondary-600">
                {r.product}
              </span>
            ))
          ) : (
            <span className="text-4xl font-bold font-heading text-secondary-600">Minyak</span>
          )}
        </div>
        <div className="flex flex-col gap-2 rounded-xl bg-primary-100 p-4">
          <span className="text-2xl font-bold font-heading text-fg-default">
            Stok Segera Expired!
          </span>
          {expiring.length > 0 ? (
            expiring.slice(0, 2).map((r) => (
              <span key={r.product} className="text-4xl font-bold font-heading text-secondary-600">
                {r.product}
              </span>
            ))
          ) : (
            <span className="text-4xl font-bold font-heading text-secondary-600">Sirup</span>
          )}
        </div>
      </div>

      <QuickScanModal open={scanOpen} onClose={() => setScanOpen(false)} />
    </div>
  );
}