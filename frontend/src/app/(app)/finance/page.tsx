"use client";

import { useEffect, useState } from "react";
import { Plus, Receipt, TrendingDown, TrendingUp, Wallet, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatCard, type StatCardProps } from "@/components/ui/StatCard";
import { AddTransactionModal } from "@/components/modals/AddTransactionModal";
import {
  getFinanceSummary,
  getTransactions,
  createTransaction,
  type FinanceSummary,
  type Transaction,
  type CreateTransactionPayload,
} from "@/services/api";

function formatRupiah(value: number) {
  return "Rp " + Math.round(value).toLocaleString("id-ID");
}

export default function FinancePage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, txData] = await Promise.all([
        getFinanceSummary(),
        getTransactions(),
      ]);
      setSummary(sumData);
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

  const financeStats: StatCardProps[] = summary
    ? [
        {
          icon: <Wallet className="h-6 w-6" />,
          label: "Pemasukan",
          value: formatRupiah(summary.total_income),
          trend: summary.income_trend,
        },
        {
          icon: <Receipt className="h-6 w-6" />,
          label: "Pengeluaran",
          value: formatRupiah(summary.total_expense),
          trend: summary.expense_trend,
          trendDirection: "down",
        },
        {
          icon: <TrendingUp className="h-6 w-6" />,
          label: "Omzet",
          value: formatRupiah(summary.total_revenue),
          trend: summary.revenue_trend,
        },
        {
          icon: <TrendingDown className="h-6 w-6" />,
          label: "Laba Bersih",
          value: formatRupiah(summary.net_profit),
          trend: summary.profit_trend,
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-fg-default">
            Keuangan
          </h1>
          <p className="text-sm text-neutral-500">
            Pencatatan uang kas warung real-time terhubung ke backend Go
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
        {loading && !summary
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse h-28 bg-neutral-200/50" />
            ))
          : financeStats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold font-heading text-fg-default">
            Arus Kas Pemasukan & Pengeluaran
          </h2>
          <div className="flex flex-col justify-center gap-3 rounded-xl bg-bg-subtle p-6 border border-fg-line">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-fg-text">Pemasukan (Masuk)</span>
              <span className="text-success-text">{formatRupiah(summary?.total_income || 0)}</span>
            </div>
            <div className="h-3 w-full bg-neutral-200 rounded-full overflow-hidden flex">
              <div
                className="bg-success-solid h-full transition-all duration-500"
                style={{
                  width: `${
                    summary && summary.total_income + summary.total_expense > 0
                      ? (summary.total_income / (summary.total_income + summary.total_expense)) * 100
                      : 50
                  }%`,
                }}
              />
              <div
                className="bg-alert-solid h-full transition-all duration-500"
                style={{
                  width: `${
                    summary && summary.total_income + summary.total_expense > 0
                      ? (summary.total_expense / (summary.total_income + summary.total_expense)) * 100
                      : 50
                  }%`,
                }}
              />
            </div>
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-fg-text">Pengeluaran (Keluar)</span>
              <span className="text-alert-text">{formatRupiah(summary?.total_expense || 0)}</span>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold font-heading text-fg-default">
            Efisiensi Margin Keuntungan
          </h2>
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl bg-tertiary-100 p-6 text-center">
            <span className="text-3xl font-extrabold font-heading text-primary-500">
              {summary && summary.total_revenue > 0
                ? `${Math.round((summary.net_profit / summary.total_revenue) * 100)}%`
                : "0%"}
            </span>
            <span className="mt-1 text-sm font-medium text-fg-text">
              Margin Laba Bersih terhadap Omzet
            </span>
            <span className="mt-2 text-xs text-neutral-500">
              {summary && summary.net_profit >= 0
                ? "Keuangan warung sehat dan surplus kas."
                : "Perhatikan pengeluaran operasional agar tidak defisit."}
            </span>
          </div>
        </Card>
      </div>

      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-heading text-fg-default">
            Riwayat Transaksi Kas
          </h2>
          <span className="text-xs text-neutral-500">
            Total {transactions.length} pencatatan
          </span>
        </div>

        <div className="flex flex-col">
          <div className="grid grid-cols-[1.2fr_2fr_1.2fr_1fr] gap-4 border-b border-fg-line py-3 text-sm font-semibold text-neutral-500">
            <span>Tanggal</span>
            <span>Keterangan</span>
            <span>Jenis & Kategori</span>
            <span className="text-right">Jumlah</span>
          </div>
          {transactions.length === 0 ? (
            <div className="py-8 text-center text-neutral-500 text-sm">
              Belum ada transaksi tercatat. Klik "Catat Transaksi" untuk menambahkan.
            </div>
          ) : (
            transactions.map((tx, index) => (
              <div
                key={tx.id || index}
                className={[
                  "grid grid-cols-[1.2fr_2fr_1.2fr_1fr] items-center gap-4 py-4",
                  index < transactions.length - 1 ? "border-b border-fg-line" : "",
                ].join(" ")}
              >
                <span className="text-fg-text text-sm">{tx.date}</span>
                <div className="flex flex-col">
                  <span className="font-semibold text-fg-default">{tx.desc}</span>
                  {tx.category && (
                    <span className="text-xs text-neutral-500">{tx.category}</span>
                  )}
                </div>
                <div>
                  <Badge tone={tx.type === "Masuk" ? "success" : "alert"}>
                    {tx.type}
                  </Badge>
                </div>
                <span
                  className={[
                    "text-right font-bold",
                    tx.type === "Masuk" ? "text-success-text" : "text-alert-text",
                  ].join(" ")}
                >
                  {tx.type === "Masuk" ? "+" : "-"} {formatRupiah(tx.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>

      <AddTransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddTransaction}
      />
    </div>
  );
}