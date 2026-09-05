"use client";

import { useEffect, useState } from "react";
import { RefreshCw, ScanLine, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SalesCompareChart } from "@/components/charts/SalesCompareChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { QuickScanModal } from "@/components/modals/QuickScanModal";
import {
  getDashboardMetrics,
  type DashboardMetrics,
} from "@/services/api";

function formatRupiah(value: number) {
  return "Rp " + Math.round(value).toLocaleString("id-ID");
}

// Fallback mock untuk tabel Barang/Terjual/Keuntungan — Hi-Fi dashboard
const MOCK_TABLE = [
  { barang: "Beras", terjual: 60, keuntungan: 100_000 },
  { barang: "Minyak", terjual: 32, keuntungan: 72_000 },
  { barang: "Gula", terjual: 32, keuntungan: 72_000 },
  { barang: "Tepung", terjual: 32, keuntungan: 72_000 },
];

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);

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

  const penjualanHariIni = metrics ? formatRupiah(metrics.today_income) : "Rp 666.000";
  const totalTerjualHariIni = metrics ? String(metrics.products_sold) : "200";
  const barangTop = MOCK_TABLE[0].barang;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-bold font-heading text-fg-default">
          Mau LARISIN apa hari ini?
        </h1>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={loadMetrics}
            title="Refresh Data"
            aria-label="Refresh Data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="tertiary"
            onClick={() => setScanOpen(true)}
          >
            <ScanLine className="h-5 w-5" />
            Quick Scan
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl bg-alert-bg p-4 text-sm text-alert-text">
          <span>Backend belum aktif atau gagal dihubungi ({error}). Menampilkan data contoh.</span>
          <Button size="sm" variant="secondary" onClick={loadMetrics}>
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
              {loading && !metrics ? "…" : stat.value}
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
            {MOCK_TABLE.map((row) => (
              <div
                key={row.barang}
                className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,2fr)] items-center border-t border-secondary-600 px-4 py-2.5"
              >
                <span className="text-xl text-black">{row.barang}</span>
                <span className="text-xl text-black">{row.terjual}</span>
                <span className="text-xl text-black">
                  {formatRupiah(row.keuntungan)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col gap-4 rounded-xl bg-neutral-200">
          <h2 className="text-lg font-semibold text-fg-default">Penjualan</h2>
          <SalesCompareChart />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Card className="flex flex-col gap-4 rounded-xl bg-neutral-200">
          <h2 className="text-lg font-bold font-heading text-fg-default">
            Penjualan Minggu Ini
          </h2>
          <DonutChart />
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
          <span className="text-4xl font-bold font-heading text-secondary-600">
            Minyak
          </span>
        </div>
        <div className="flex flex-col gap-2 rounded-xl bg-primary-100 p-4">
          <span className="text-2xl font-bold font-heading text-fg-default">
            Stok Segera Expired!
          </span>
          <span className="text-4xl font-bold font-heading text-secondary-600">
            Sirup
          </span>
        </div>
      </div>

      <QuickScanModal open={scanOpen} onClose={() => setScanOpen(false)} />
    </div>
  );
}
