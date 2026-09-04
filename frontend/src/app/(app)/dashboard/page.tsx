import {
  Package,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatCard, type StatCardProps } from "@/components/ui/StatCard";

const stats: StatCardProps[] = [
  {
    icon: <ShoppingCart className="h-6 w-6" />,
    label: "Total Pesanan",
    value: "128",
    trend: "+12%",
  },
  {
    icon: <Wallet className="h-6 w-6" />,
    label: "Total Omzet",
    value: "Rp 2.450.000",
    trend: "+8%",
  },
  {
    icon: <Package className="h-6 w-6" />,
    label: "Stok Menipis",
    value: "6",
    trend: "-2",
    trendDirection: "down",
  },
];

const recentOrders = [
  { id: "#00124", item: "Seblak Ceker", qty: 2, total: "Rp 28.000", status: "Selesai" },
  { id: "#00123", item: "Es Teh Manis", qty: 3, total: "Rp 9.000", status: "Diproses" },
  { id: "#00122", item: "Indomie Goreng", qty: 1, total: "Rp 12.000", status: "Baru" },
  { id: "#00121", item: "Kerupuk", qty: 5, total: "Rp 10.000", status: "Selesai" },
  { id: "#00120", item: "Seblak Basah", qty: 2, total: "Rp 30.000", status: "Diproses" },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold font-heading text-fg-default">
        Dashboard
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-heading text-fg-default">
              Pesanan Terbaru
            </h2>
            <TrendingUp className="h-5 w-5 text-primary-400" />
          </div>
          <div className="flex flex-col">
            {recentOrders.map((order, index) => (
              <div
                key={order.id}
                className={[
                  "flex items-center justify-between gap-4 py-3",
                  index < recentOrders.length - 1
                    ? "border-b border-fg-line"
                    : "",
                ].join(" ")}
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-fg-default">
                    {order.item}
                  </span>
                  <span className="text-sm text-neutral-500">
                    {order.id} · {order.qty} item
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-fg-default">
                    {order.total}
                  </span>
                  <span
                    className={[
                      "rounded-full px-3 py-1 text-sm font-semibold",
                      order.status === "Selesai"
                        ? "bg-success-bg text-success-text"
                        : order.status === "Diproses"
                          ? "bg-info-bg text-info-text"
                          : "bg-warning-bg text-warning-text",
                    ].join(" ")}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold font-heading text-fg-default">
            Aktivitas Warung
          </h2>
          <div className="flex flex-1 items-center justify-center rounded-xl bg-tertiary-100">
            <span className="text-sm font-semibold text-tertiary-500">
              Grafik penjualan akan tampil di sini
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}