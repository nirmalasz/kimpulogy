import { MapPin, Package, ShoppingCart, TrendingUp, Wallet } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatCard, type StatCardProps } from "@/components/ui/StatCard";

const overviewStats: StatCardProps[] = [
  {
    icon: <ShoppingCart className="h-6 w-6" />,
    label: "Pesanan Hari Ini",
    value: "24",
    trend: "+5",
  },
  {
    icon: <Wallet className="h-6 w-6" />,
    label: "Pemasukan",
    value: "Rp 420.000",
    trend: "+15%",
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    label: "Pengeluaran",
    value: "Rp 180.000",
    trend: "-3%",
    trendDirection: "down",
  },
  {
    icon: <Package className="h-6 w-6" />,
    label: "Produk Terjual",
    value: "86",
    trend: "+9%",
  },
];

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold font-heading text-fg-default">
        Overview
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {overviewStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="flex flex-col gap-4 xl:col-span-2">
          <h2 className="text-lg font-bold font-heading text-fg-default">
            Statistik Penjualan
          </h2>
          <div className="flex flex-1 items-center justify-center rounded-xl bg-tertiary-100">
            <span className="text-sm font-semibold text-tertiary-500">
              Grafik donat penjualan akan tampil di sini
            </span>
          </div>
        </Card>
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold font-heading text-fg-default">
            Lokasi Warung
          </h2>
          <div className="flex flex-1 items-center justify-center rounded-xl bg-neutral-200">
            <MapPin className="h-6 w-6 text-primary-400" />
            <span className="ml-2 text-sm font-semibold text-fg-text">
              Peta akan tampil di sini
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}