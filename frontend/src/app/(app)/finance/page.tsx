"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DonutChart } from "@/components/charts/DonutChart";
import { AddTransactionModal } from "@/components/modals/AddTransactionModal";
import {
  getFinanceSummary,
  getFinanceComponents,
  getTransactions,
  createTransaction,
  type FinanceSummary,
  type FinanceComponent,
  type Transaction,
  type CreateTransactionPayload,
} from "@/services/api";

function formatRupiah(value: number) {
  return "Rp " + Math.round(value).toLocaleString("id-ID");
}

function formatComponent(value: number) {
  const sign = value < 0 ? "-" : "";
  return sign + Math.abs(Math.round(value)).toLocaleString("id-ID");
}

export default function FinancePage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [components, setComponents] = useState<FinanceComponent[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, compData, txData] = await Promise.all([
        getFinanceSummary(),
        getFinanceComponents(),
        getTransactions(),
      ]);
      setSummary(sumData);
      setComponents(compData.rows);
      setTransactions(txData);
    } catch (err: any) {
      setError(err?.message || "Gagal memuat data dari server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddTransaction = async (payload: CreateTransactionPayload) => {
    await createTransaction(payload);
    await loadData();
  };

  const kpiCards = summary
    ? [
        {
          label: "Total Pengeluaran",
          value: formatRupiah(summary.total_expense),
          trend: summary.expense_trend,
          trendDown: true,
        },
        {
          label: "Gross Margin",
          value: formatRupiah(summary.total_revenue),
          trend: summary.revenue_trend,
        },
        {
          label: "Keuntungan Kotor",
          value: `${
            summary.total_revenue > 0
              ? Math.round((summary.net_profit / summary.total_revenue) * 100)
              : 0
          }%`,
          trend: summary.profit_trend,
        },
        {
          label: "Nett Profit",
          value: formatRupiah(summary.net_profit),
          trend: summary.profit_trend,
        },
      ]
    : [
        { label: "Total Pengeluaran", value: "Rp 8.000.000", trend: "Naik 8%", trendDown: true },
        { label: "Gross Margin", value: "Rp 10.000.000", trend: "Naik 8%" },
        { label: "Keuntungan Kotor", value: "30%", trend: "Naik 8%" },
        { label: "Nett Profit", value: "Rp 6.000.000", trend: "Naik 8%" },
      ];

  const masuk = transactions.filter((tx) => tx.type === "Masuk");
  const keluar = transactions.filter((tx) => tx.type === "Keluar");

  const renderHistory = (rows: Transaction[], accent: "income" | "expense") => (
    <div className="flex flex-col">
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-500">
          Belum ada transaksi tercatat
        </p>
      ) : (
        rows.map((tx, index) => (
          <div
            key={tx.id || index}
            className="flex items-center justify-between gap-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={[
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  accent === "income"
                    ? "bg-success-bg text-success-text"
                    : "bg-alert-bg text-alert-text",
                ].join(" ")}
              >
                {accent === "income" ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold text-fg-default">
                  {tx.desc}
                </span>
                <span className="text-xs text-neutral-500">{tx.date}</span>
              </div>
            </div>
            <span
              className={[
                "shrink-0 text-sm font-bold",
                accent === "income" ? "text-success-text" : "text-alert-text",
              ].join(" ")}
            >
              {accent === "income" ? "+" : "-"} {formatRupiah(tx.amount)}
            </span>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-heading text-fg-default">
            Keuangan
          </h1>
          <p className="text-base text-neutral-500">
            Ringkasan transaksi dan performa warung
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={loadData}
            title="Refresh Data"
            aria-label="Refresh Data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-5 w-5" />
            Catat Transaksi
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl bg-alert-bg p-4 text-sm text-alert-text">
          <span>Backend belum aktif atau gagal dihubungi ({error}). Pastikan server Go berjalan di port 8080.</span>
          <Button size="sm" variant="secondary" onClick={loadData}>
            Coba Lagi
          </Button>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-2 rounded-lg border-2 border-tertiary-500 bg-tertiary-100 p-4"
          >
            <span className="text-2xl font-bold font-heading text-fg-default">
              {stat.label}
            </span>
            <span className="text-2xl font-bold font-heading text-secondary-600">
              {stat.value}
            </span>
            <span className="flex items-center gap-1 text-base text-black">
              {stat.trend}
              {stat.trendDown ? (
                <TrendingDown className="h-5 w-5 text-fg-default" />
              ) : (
                <TrendingUp className="h-5 w-5 text-fg-default" />
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="flex flex-col gap-2">
          <h2 className="text-lg font-bold font-heading text-fg-default">
            Riwayat Pemasukan
          </h2>
          {renderHistory(masuk, "income")}
        </Card>
        <Card className="flex flex-col gap-2">
          <h2 className="text-lg font-bold font-heading text-fg-default">
            Riwayat Pengeluaran
          </h2>
          {renderHistory(keluar, "expense")}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card padded={false} className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-lg font-bold font-heading text-fg-default">
              Komponen
            </span>
            <span className="text-lg font-bold font-heading text-fg-default">
              Jumlah (IDR)
            </span>
          </div>
          <div className="flex flex-col">
            {(components.length > 0 ? components : [
              { label: "Total Pemasukan (Omset)", value: 18_000_000 },
              { label: "Harga Pokok Penjualan (HPP)", value: -8_000_000 },
              { label: "Laba Kotor (Gross Profit)", value: 10_000_000 },
              { label: "Biaya Operasional (Listrik, karyawan)", value: -5_200_000 },
              { label: "Laba Bersih (Nett profit)", value: 4_800_000 },
            ]).map((row, index) => (
              <div
                key={row.label}
                className={[
                  "flex items-center justify-between gap-4 px-4 py-2.5",
                  index < (components.length || 5) - 1 ? "border-b border-fg-line" : "",
                  row.label.startsWith("Laba Bersih") ? "bg-secondary-100 font-bold" : "",
                ].join(" ")}
              >
                <span
                  className={[
                    "text-base",
                    row.label.startsWith("Laba Bersih")
                      ? "font-bold font-heading text-fg-default"
                      : "text-fg-default",
                  ].join(" ")}
                >
                  {row.label}
                </span>
                <span
                  className={[
                    "text-base",
                    row.value < 0 ? "text-alert-text" : "text-fg-default",
                    row.label.startsWith("Laba Bersih") ? "font-bold" : "",
                  ].join(" ")}
                >
                  {formatComponent(row.value)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col gap-4 rounded-xl bg-neutral-200">
          <h2 className="text-lg font-bold font-heading text-fg-default">
            Minggu Ini
          </h2>
          <DonutChart />
        </Card>
      </div>

      <AddTransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddTransaction}
      />
    </div>
  );
}