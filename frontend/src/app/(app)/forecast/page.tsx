import { Package, ShoppingCart, TrendingUp, Wallet } from "lucide-react";
import { Card } from "@/components/ui/Card";

const forecastStats = [
  {
    label: "Perkiraan Pesanan",
    value: "145",
    trend: "+9%",
  },
  {
    label: "Perkiraan Omzet",
    value: "Rp 2.800.000",
    trend: "+14%",
  },
  {
    label: "Stok Dibutuhkan",
    value: "72",
    trend: "+3%",
  },
];

export default function ForecastPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-4xl font-bold font-heading text-fg-default">
        Forecast
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {forecastStats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-2 rounded-lg border-2 border-tertiary-500 bg-tertiary-100 p-4"
          >
            <span className="flex items-center justify-between">
              <span className="text-2xl font-bold font-heading text-fg-default">
                {stat.label}
              </span>
            </span>
            <span className="text-2xl font-bold font-heading text-secondary-600">
              {stat.value}
            </span>
            <span className="flex items-center gap-1 text-base text-black">
              {stat.trend}
              <TrendingUp className="h-5 w-5 text-fg-default" />
            </span>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="flex flex-col gap-4 rounded-xl bg-neutral-200">
          <h2 className="text-lg font-bold font-heading text-fg-default">
            Prediksi Penjualan
          </h2>
          <div className="flex h-[260px] flex-1 items-center justify-center rounded-xl bg-bg-default">
            <span className="text-sm font-semibold text-tertiary-500">
              Grafik prediksi penjualan akan tampil di sini
            </span>
          </div>
        </Card>
        <Card className="flex flex-col gap-4 rounded-xl bg-neutral-200">
          <h2 className="text-lg font-bold font-heading text-fg-default">
            Prediksi Stok
          </h2>
          <div className="flex h-[260px] flex-1 items-center justify-center rounded-xl bg-bg-default">
            <span className="text-sm font-semibold text-tertiary-500">
              Grafik prediksi stok akan tampil di sini
            </span>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {[
          {
            icon: <Package className="h-6 w-6" />,
            title: "Rekomendasi Restock",
            body: "Seblak Basah diperkirakan habis dalam 3 hari.",
          },
          {
            icon: <ShoppingCart className="h-6 w-6" />,
            title: "Produk Terlaris",
            body: "Seblak Ceker tetap jadi produk terlaris minggu ini.",
          },
          {
            icon: <Wallet className="h-6 w-6" />,
            title: "Saran Penambahan Stok",
            body: "Tambah stok minuman menjelang akhir pekan.",
          },
        ].map((item) => (
          <Card
            key={item.title}
            className="flex flex-col gap-3 rounded-xl border-2 border-tertiary-500 bg-tertiary-100"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-100 text-secondary-600">
              {item.icon}
            </span>
            <h3 className="font-bold font-heading text-fg-default">
              {item.title}
            </h3>
            <p className="text-sm text-fg-text">{item.body}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}