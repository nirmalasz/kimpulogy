"use client";

import { useEffect, useState } from "react";
import { Package, RefreshCw, ShoppingCart, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  getForecastRestock,
  createPurchase,
  type RestockResponse,
  type RestockRecommendation,
} from "@/services/api";

function formatQty(v: number) {
  if (v <= 0) return "0";
  return v % 1 === 0 ? String(v) : v.toFixed(1);
}

const URGENCY_META: Record<string, { label: string; badge: string }> = {
  habis: { label: "Habis", badge: "bg-alert-solid text-white" },
  urgent: { label: "Urgent", badge: "bg-secondary-600 text-white" },
  soon: { label: "Segera", badge: "bg-secondary-400 text-white" },
  ok: { label: "Aman", badge: "bg-success-solid text-white" },
};

export default function ForecastPage() {
  const [data, setData] = useState<RestockResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restocking, setRestocking] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await getForecastRestock();
      setData(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat rekomendasi restock");
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    setLoading(true);
    void load();
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getForecastRestock();
        if (cancelled) return;
        setData(res);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Gagal memuat rekomendasi restock");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRestock = async (rec: RestockRecommendation) => {
    setRestocking(rec.product_id);
    try {
      await createPurchase({
        product_id: rec.product_id,
        qty: rec.recommended_restock,
      });
      setToast(`${rec.name}: stok bertambah ${rec.recommended_restock}`);
      await load();
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Gagal mencatat pembelian");
    } finally {
      setRestocking(null);
    }
  };

  const needsRestock = data?.recommendations.filter((r) => r.urgency !== "ok") || [];
  const demandTop = data?.recommendations
    ? [...data.recommendations].sort((a, b) => b.forecast_7d - a.forecast_7d).slice(0, 3)
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-heading text-fg-default">Forecast</h1>
          <p className="text-base text-neutral-500">
            Rekomendasi restock berbasis prediksi kebutuhan 7 hari
          </p>
        </div>
        <Button
          variant="secondary"
onClick={refresh}
          title="Refresh Data"
          aria-label="Refresh Data"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl bg-alert-bg p-4 text-sm text-alert-text">
          <span>{error}</span>
          <Button size="sm" variant="secondary" onClick={refresh}>
            Coba Lagi
          </Button>
        </div>
      )}

      {toast && (
        <div className="rounded-xl bg-info-bg p-3 text-sm text-info-text">{toast}</div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <div className="flex flex-col gap-2 rounded-lg border-2 border-tertiary-500 bg-tertiary-100 p-4">
          <span className="flex items-center gap-2 text-2xl font-bold font-heading text-fg-default">
            <ShoppingCart className="h-6 w-6 text-secondary-600" />
            Perlu Restock
          </span>
          <span className="text-2xl font-bold font-heading text-secondary-600">
            {loading && !data ? "…" : needsRestock.length}
          </span>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border-2 border-tertiary-500 bg-tertiary-100 p-4">
          <span className="flex items-center gap-2 text-2xl font-bold font-heading text-fg-default">
            <TrendingUp className="h-6 w-6 text-secondary-600" />
            Permintaan Tertinggi
          </span>
          <span className="text-2xl font-bold font-heading text-secondary-600">
            {demandTop[0]?.name ?? "—"}
          </span>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border-2 border-tertiary-500 bg-tertiary-100 p-4">
          <span className="flex items-center gap-2 text-2xl font-bold font-heading text-fg-default">
            <Package className="h-6 w-6 text-secondary-600" />
            Model
          </span>
          <span className="text-2xl font-bold font-heading text-secondary-600">
            {data?.model_type === "moving_average_baseline" ? "Moving Avg" : data?.model_type ?? "…"}
          </span>
        </div>
      </div>

      <Card padded={false} className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-fg-line px-4 py-3">
          <span className="text-lg font-bold font-heading text-fg-default">
            Rekomendasi Restock (7 hari)
          </span>
          {data ? (
            <span className="text-xs text-neutral-500">
              {data.source} · {data.trained_at?.slice(0, 10)}
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_1fr_auto] items-center gap-3 border-b border-fg-line bg-secondary-100 px-4 py-2 text-sm font-bold font-heading text-fg-default">
          <span>Produk</span>
          <span>Stok</span>
          <span>Kebutuhan 7d</span>
          <span>Rekomendasi</span>
          <span>Status</span>
          <span className="w-24 text-right">Aksi</span>
        </div>
        <div className="flex flex-col">
          {loading && !data ? (
            <p className="py-8 text-center text-sm text-neutral-500">Memuat rekomendasi...</p>
          ) : data?.recommendations.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-500">
              Belum ada data produk. Tambahkan produk dulu di halaman Stok.
            </p>
          ) : (
            data?.recommendations.map((rec) => {
              const meta = URGENCY_META[rec.urgency];
              return (
                <div
                  key={rec.product_id}
                  className="grid grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_1fr_auto] items-center gap-3 border-b border-fg-line px-4 py-3 last:border-b-0"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold text-fg-default">{rec.name}</span>
                    {rec.sku ? <span className="truncate text-xs text-neutral-500">{rec.sku}</span> : null}
                  </div>
                  <span className="text-fg-text">{rec.current_stock}</span>
                  <span className="text-fg-text">{formatQty(rec.forecast_7d)}</span>
                  <span className="font-bold text-secondary-600">{rec.recommended_restock}</span>
                  <span>
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${meta.badge}`}>
                      {meta.label}
                    </span>
                  </span>
                  <span className="flex justify-end">
                    <Button
                      size="sm"
                      disabled={restocking === rec.product_id || rec.recommended_restock <= 0}
                      onClick={() => handleRestock(rec)}
                    >
                      {restocking === rec.product_id ? "..." : <Wallet className="h-4 w-4" />}
                      Catat
                    </Button>
                  </span>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="flex flex-col gap-4 rounded-xl bg-neutral-200">
          <h2 className="text-lg font-bold font-heading text-fg-default">Permintaan Teratas</h2>
          <div className="flex flex-col gap-3">
            {demandTop.map((rec) => (
              <div key={rec.product_id} className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-fg-default">{rec.name}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-neutral-300">
                  <div
                    className="h-full rounded-full bg-secondary-500"
                    style={{
                      width: `${demandTop[0].forecast_7d > 0 ? (rec.forecast_7d / demandTop[0].forecast_7d) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="w-16 text-right text-sm font-bold text-fg-default">
                  {formatQty(rec.forecast_7d)}
                </span>
              </div>
            ))}
            {demandTop.length === 0 ? (
              <p className="text-sm text-neutral-500">Belum ada data.</p>
            ) : null}
          </div>
        </Card>

        <Card className="flex flex-col gap-4 rounded-xl bg-neutral-200">
          <h2 className="text-lg font-bold font-heading text-fg-default">Tentang Model</h2>
          <p className="text-sm text-fg-text">
            Rekomendasi dihitung dari rata-rata permintaan harian (moving average) per produk,
            dengan penyesuaian hari-dalam-seminggu dan stok aman (p90). Saat data penjualan harian
            warungmu menumpuk, model akan dilatih ulang pada data tersebut (ARIMA/Prophet).
          </p>
          <p className="text-xs text-neutral-500">
            Sumber base: {data?.source || "belum dilatih"} · Horizon {data?.horizon ?? 7} hari
          </p>
        </Card>
      </div>
    </div>
  );
}