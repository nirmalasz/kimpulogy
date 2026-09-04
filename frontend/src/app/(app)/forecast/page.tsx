import { Package, ShoppingCart, Wallet } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatCard, type StatCardProps } from "@/components/ui/StatCard";

const forecastStats: StatCardProps[] = [
  {
    icon: <ShoppingCart className="h-6 w-6" />,
    label: "Perkiraan Pesanan",
    value: "145",
    trend: "+9%",
  },
  {
    icon: <Wallet className="h-6 w-6" />,
    label: "Perkiraan Omzet",
    value: "Rp 2.800.000",
    trend: "+14%",
  },
  {
    icon: <Package className="h-6 w-6" />,
    label: "Stok Dibutuhkan",
    value: "72",
    trend: "+3%",
  },
];

export default function ForecastPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold font-heading text-fg-default">
        Forecast
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {forecastStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold font-heading text-fg-default">
            Prediksi Penjualan
          </h2>
          <div className="flex h-[308px] flex-1 items-center justify-center rounded-xl bg-tertiary-100">
            <span className="text-sm font-semibold text-tertiary-500">
              Grafik prediksi penjualan akan tampil di sini
            </span>
          </div>
        </Card>
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold font-heading text-fg-default">
            Prediksi Stok
          </h2>
          <div className="flex h-[308px] flex-1 items-center justify-center rounded-xl bg-tertiary-100">
            <span className="text-sm font-semibold text-tertiary-500">
              Grafik prediksi stok akan tampil di sini
            </span>
          </div>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="flex flex-col gap-3">
          <h3 className="font-bold font-heading text-fg-default">
            Rekomendasi Restock
          </h3>
          <p className="text-sm text-fg-text">
            Seblak Basah diperkirakan habis dalam 3 hari.
          </p>
        </Card>
        <Card className="flex flex-col gap-3">
          <h3 className="font-bold font-heading text-fg-default">
            Produk Terlaris
          </h3>
          <p className="text-sm text-fg-text">
            Seblak Ceker tetap jadi produk terlaris minggu ini.
          </p>
        </Card>
        <Card className="flex flex-col gap-3">
          <h3 className="font-bold font-heading text-fg-default">
            Saran Penambahan Stok
          </h3>
          <p className="text-sm text-fg-text">
            Tambah stok minuman menjelang akhir pekan.
          </p>
        </Card>
      </div>
    </div>
  );
}