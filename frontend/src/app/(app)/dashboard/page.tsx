"use client";

import { useEffect, useState } from "react";
import { ClipboardList, RefreshCw, ScanLine, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SalesCompareChart } from "@/components/charts/SalesCompareChart";
import { DonutChart, type DonutSlice } from "@/components/charts/DonutChart";
import { QuickScanModal } from "@/components/modals/QuickScanModal";
import { ManualSaleModal } from "@/components/modals/ManualSaleModal";
import {
	getDashboardAnalytics,
	getDashboardInsight,
	getDashboardMetrics,
	type DashboardAnalytics,
	type DashboardMetrics,
	type AIInsight,
} from "@/services/api";
import { formatQty, formatRupiah } from "@/lib/format";

const MIX_COLORS = ["#EA6C0C", "#FBA33C", "#354973", "#A1BD25", "#7F90BB", "#F98613", "#3D568F"];

export default function DashboardPage() {
	const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
	const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
	const [insight, setInsight] = useState<AIInsight | null>(null);
	const [insightError, setInsightError] = useState<string | null>(null);
	const [insightLoading, setInsightLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [manualSaleOpen, setManualSaleOpen] = useState(false);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
		const [analyticsData, metricsData] = await Promise.all([
			getDashboardAnalytics(),
			getDashboardMetrics(),
		]);
		setAnalytics(analyticsData);
		setMetrics(metricsData);
    } catch (err: any) {
      setError(err?.message || "Gagal memuat metrics");
    } finally {
      setLoading(false);
    }
	};

	const loadInsight = async () => {
		setInsightLoading(true);
		setInsightError(null);
		try {
			setInsight(await getDashboardInsight());
		} catch (err) {
			setInsight(null);
			setInsightError(err instanceof Error ? err.message : "Insight belum tersedia");
		} finally {
			setInsightLoading(false);
		}
	};

	useEffect(() => {
		void loadAnalytics();
		void loadInsight();
	}, []);

  const donutSlices: DonutSlice[] = (analytics?.weekly_mix || []).map((item, i) => ({
    label: item.label,
    value: item.value,
    color: MIX_COLORS[i % MIX_COLORS.length],
  }));

	const penjualanHariIni = metrics ? formatRupiah(metrics.today_income) : "—";
	const totalTerjualHariIni = metrics ? String(metrics.products_sold) : "—";
	const barangTop = analytics?.top_products?.[0]?.name || "—";

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
						onClick={() => {
							void loadAnalytics();
							void loadInsight();
						}}
            title="Refresh Data"
            aria-label="Refresh Data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="tertiary" onClick={() => setScanOpen(true)}>
            <ScanLine className="h-5 w-5" />
            Quick Scan
          </Button>
          <Button variant="outline" onClick={() => setManualSaleOpen(true)}>
            <ClipboardList className="h-5 w-5" />
            Catat Manual
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl bg-alert-bg p-4 text-sm text-alert-text">
			<span>Backend belum aktif atau gagal dihubungi ({error}).</span>
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
            <span className="text-center">Terjual</span>
            <span className="text-right">Keuntungan</span>
          </div>
          <div className="flex flex-col">
							{(analytics?.top_products || []).map((row) => (
              <div
                key={row.name}
                className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,2fr)] items-center border-t border-secondary-600 px-4 py-2.5"
              >
                <span className="text-xl text-black">{row.name}</span>
                <span className="text-center text-xl text-black">{formatQty(row.qty)}</span>
                <span className="text-right text-xl text-black">
                  {row.profit_str || formatRupiah(row.profit)}
                </span>
              </div>
							))}
							{!loading && analytics?.top_products.length === 0 ? (
								<p className="p-4 text-sm text-neutral-500">Belum ada data penjualan.</p>
							) : null}
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

						<Card className="flex flex-col gap-3 rounded-xl bg-neutral-300 p-4">
          <h2 className="text-2xl font-bold font-heading text-secondary-600">
            Insights
          </h2>
							{insightLoading ? <p className="text-sm text-neutral-500">Menganalisis data warung...</p> : null}
							{insightError ? <p className="text-sm text-neutral-500">Insight belum tersedia: {insightError}</p> : null}
							{insight ? (
								<>
									<p className="text-base text-fg-text">{insight.summary}</p>
									{insight.observations.length > 0 ? (
										<ul className="list-disc pl-5 text-sm text-fg-text">
											{insight.observations.map((observation) => <li key={observation}>{observation}</li>)}
										</ul>
									) : null}
									{insight.actions.length > 0 ? (
										<p className="text-sm text-secondary-600">Saran: {insight.actions.join("; ")}</p>
									) : null}
								</>
							) : null}
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
							<span className="text-4xl font-bold font-heading text-secondary-600">—</span>
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
							<span className="text-4xl font-bold font-heading text-secondary-600">—</span>
          )}
        </div>
      </div>

      <QuickScanModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onSaved={() => {
          void loadAnalytics();
          void loadInsight();
        }}
      />
      <ManualSaleModal
        open={manualSaleOpen}
        onClose={() => setManualSaleOpen(false)}
        onSaved={() => {
          void loadAnalytics();
          void loadInsight();
        }}
      />
    </div>
  );
}
