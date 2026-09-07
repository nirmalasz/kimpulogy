"use client";

import { useEffect, useState } from "react";
import {
  Download,
  Plus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DonutChart, type DonutSlice } from "@/components/charts/DonutChart";
import { AddTransactionModal } from "@/components/modals/AddTransactionModal";
import {
  getFinanceComponents,
  getTransactions,
  createTransaction,
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
  const [components, setComponents] = useState<FinanceComponent[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [compData, txData] = await Promise.all([
        getFinanceComponents(),
        getTransactions(),
      ]);
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

  const MIX_COLORS = ["#EA6C0C", "#FBA33C", "#354973", "#A1BD25"];

const handleAddTransaction = async (payload: CreateTransactionPayload) => {
    await createTransaction(payload);
    await loadData();
  };

  const comp = (prefix: string) =>
    components.find((c) => c.label.startsWith(prefix))?.value ?? 0;
  const omset = comp("Total Pemasukan");
  const hpp = Math.abs(comp("HPP"));
  const gross = comp("Laba Kotor");
  const biaya = Math.abs(comp("Biaya Operasional"));
  const net = comp("Laba Bersih");

  const kpiCards = components.length > 0
    ? [
        { label: "Total Pengeluaran", value: formatRupiah(biaya), caption: "Biaya Operasional" },
        { label: "Gross Margin", value: formatRupiah(omset), caption: "Total Pemasukan" },
        { label: "Keuntungan Kotor", value: formatRupiah(gross), caption: "Laba Kotor" },
        { label: "Nett Profit", value: formatRupiah(net), caption: "Laba Bersih" },
      ]
    : [
        { label: "Total Pengeluaran", value: "Rp 8.000.000", caption: "Biaya Operasional" },
        { label: "Gross Margin", value: "Rp 10.000.000", caption: "Total Pemasukan" },
        { label: "Keuntungan Kotor", value: "Rp 6.000.000", caption: "Laba Kotor" },
        { label: "Nett Profit", value: "Rp 1.097.000", caption: "Laba Bersih" },
      ];

  const componentSlices: DonutSlice[] = components.length > 0
    ? [
        { label: "Total Pemasukan (Omset)", value: Math.round(omset), color: MIX_COLORS[0] },
        { label: "HPP", value: Math.round(hpp), color: MIX_COLORS[1] },
        { label: "Laba Kotor", value: Math.max(0, Math.round(gross)), color: MIX_COLORS[2] },
        { label: "Biaya Operasional", value: Math.round(biaya), color: MIX_COLORS[3] },
      ]
    : [
        { label: "Total Pemasukan", value: 18_000_000, color: MIX_COLORS[0] },
        { label: "HPP", value: 8_000_000, color: MIX_COLORS[1] },
        { label: "Laba Kotor", value: 10_000_000, color: MIX_COLORS[2] },
        { label: "Biaya Operasional", value: 5_200_000, color: MIX_COLORS[3] },
      ];

  const masuk = transactions.filter((tx) => tx.type === "Masuk");
  const keluar = transactions.filter((tx) => tx.type === "Keluar");
  const visible = 5;

  const renderHistory = (rows: Transaction[], accent: "income" | "expense") => (
    <div className="flex max-h-72 flex-col overflow-y-auto pr-1">
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-500">
          Belum ada transaksi tercatat
        </p>
      ) : (
        <>
          {rows.slice(0, visible).map((tx, index) => (
            <div
              key={tx.id || index}
              className="flex items-center justify-between gap-4 border-b border-fg-line py-3 last:border-b-0"
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
          ))}
          {rows.length > visible ? (
            <p className="py-2 text-center text-xs text-neutral-500">
              +{rows.length - visible} lainnya
            </p>
          ) : null}
        </>
      )}
    </div>
  );

  const exportCSV = () => {
    const esc = (v: string | number) => {
      const s = String(v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const line = (cells: (string | number)[]) => cells.map(esc).join(",");

    const fallbackComponents = [
      { label: "Total Pemasukan (Omset)", value: 0 },
      { label: "Harga Pokok Penjualan (HPP)", value: 0 },
      { label: "Laba Kotor (Gross Profit)", value: 0 },
      { label: "Biaya Operasional (Listrik, karyawan)", value: 0 },
      { label: "Laba Bersih (Nett profit)", value: 0 },
    ];

    const csvRows: string[] = [];
    csvRows.push("LARISIN - LAPORAN KEUANGAN");
    csvRows.push("");
    csvRows.push("KOMPONEN");
    csvRows.push(line(["Komponen", "Jumlah (IDR)"]));
    for (const c of components.length > 0 ? components : fallbackComponents) {
      csvRows.push(line([c.label, formatComponent(c.value)]));
    }
    csvRows.push("");
    csvRows.push("RIWAYAT PEMASUKAN");
    csvRows.push(line(["Tanggal", "Keterangan", "Kategori", "Jumlah (IDR)"]));
    for (const tx of masuk) {
      csvRows.push(line([tx.date, tx.desc, tx.category, formatComponent(tx.amount)]));
    }
    csvRows.push("");
    csvRows.push("RIWAYAT PENGELUARAN");
    csvRows.push(line(["Tanggal", "Keterangan", "Kategori", "Jumlah (IDR)"]));
    for (const tx of keluar) {
      csvRows.push(line([tx.date, tx.desc, tx.category, formatComponent(tx.amount)]));
    }

    const blob = new Blob(["\uFEFF" + csvRows.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "laporan-keuangan-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-5 w-5" />
            Export CSV
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
            <span className="text-base text-black">{stat.caption}</span>
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
            Komponen Keuangan
          </h2>
          <DonutChart slices={componentSlices} />
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