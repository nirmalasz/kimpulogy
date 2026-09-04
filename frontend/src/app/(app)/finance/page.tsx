import { Receipt, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { StatCard, type StatCardProps } from "@/components/ui/StatCard";

const financeStats: StatCardProps[] = [
  {
    icon: <Wallet className="h-6 w-6" />,
    label: "Pemasukan",
    value: "Rp 12.450.000",
    trend: "+18%",
  },
  {
    icon: <Receipt className="h-6 w-6" />,
    label: "Pengeluaran",
    value: "Rp 4.320.000",
    trend: "+6%",
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    label: "Omzet",
    value: "Rp 15.700.000",
    trend: "+21%",
  },
  {
    icon: <TrendingDown className="h-6 w-6" />,
    label: "Laba Bersih",
    value: "Rp 8.130.000",
    trend: "+9%",
  },
];

const transactions = [
  { date: "01 Sep 2026", desc: "Penjualan harian", type: "Masuk", amount: "Rp 380.000" },
  { date: "01 Sep 2026", desc: "Beli stok seblak", type: "Keluar", amount: "Rp 120.000" },
  { date: "31 Agu 2026", desc: "Penjualan harian", type: "Masuk", amount: "Rp 415.000" },
  { date: "31 Agu 2026", desc: "Beli gas & kemasan", type: "Keluar", amount: "Rp 85.000" },
  { date: "30 Agu 2026", desc: "Penjualan harian", type: "Masuk", amount: "Rp 362.000" },
  { date: "30 Agu 2026", desc: "Beli stok minuman", type: "Keluar", amount: "Rp 96.000" },
];

export default function FinancePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold font-heading text-fg-default">
        Keuangan
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {financeStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold font-heading text-fg-default">
            Grafik Pemasukan
          </h2>
          <div className="flex h-[308px] flex-1 items-center justify-center rounded-xl bg-tertiary-100">
            <span className="text-sm font-semibold text-tertiary-500">
              Grafik pemasukan akan tampil di sini
            </span>
          </div>
        </Card>
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold font-heading text-fg-default">
            Grafik Pengeluaran
          </h2>
          <div className="flex h-[308px] flex-1 items-center justify-center rounded-xl bg-tertiary-100">
            <span className="text-sm font-semibold text-tertiary-500">
              Grafik pengeluaran akan tampil di sini
            </span>
          </div>
        </Card>
      </div>
      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold font-heading text-fg-default">
          Riwayat Transaksi
        </h2>
        <div className="flex flex-col">
          <div className="grid grid-cols-[1fr_2fr_1fr_1fr] gap-4 border-b border-fg-line py-3 text-sm font-semibold text-neutral-500">
            <span>Tanggal</span>
            <span>Keterangan</span>
            <span>Jenis</span>
            <span className="text-right">Jumlah</span>
          </div>
          {transactions.map((tx, index) => (
            <div
              key={index}
              className={[
                "grid grid-cols-[1fr_2fr_1fr_1fr] items-center gap-4 py-4",
                index < transactions.length - 1
                  ? "border-b border-fg-line"
                  : "",
              ].join(" ")}
            >
              <span className="text-fg-text">{tx.date}</span>
              <span className="font-semibold text-fg-default">{tx.desc}</span>
              <Badge tone={tx.type === "Masuk" ? "success" : "alert"}>
                {tx.type}
              </Badge>
              <span className="text-right font-semibold text-fg-default">
                {tx.amount}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}