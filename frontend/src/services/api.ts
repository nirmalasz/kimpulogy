const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export interface Transaction {
  id: number;
  type: "Masuk" | "Keluar";
  category: string;
  amount: number;
  desc: string;
  date: string;
  created_at?: string;
}

export interface FinanceSummary {
  total_income: number;
  total_expense: number;
  total_revenue: number;
  net_profit: number;
  income_trend: string;
  expense_trend: string;
  revenue_trend: string;
  profit_trend: string;
}

export interface CreateTransactionPayload {
  type: "Masuk" | "Keluar";
  category?: string;
  amount: number;
  desc: string;
  date?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost?: number;
  stock: number;
}

export interface Order {
  id: string;
  item: string;
  qty: number;
  total: string;
  status: "Baru" | "Diproses" | "Selesai";
}

export interface DashboardMetrics {
  total_orders: number;
  total_omzet: number;
  low_stock_count: number;
  recent_orders: Order[];
  today_orders: number;
  today_income: number;
  today_expense: number;
  products_sold: number;
}

export async function getFinanceSummary(): Promise<FinanceSummary> {
  const res = await fetch(`${API_BASE_URL}/finance/summary`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch finance summary: ${res.statusText}`);
  }
  return res.json();
}

export async function getTransactions(): Promise<Transaction[]> {
  const res = await fetch(`${API_BASE_URL}/finance/transactions`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch transactions: ${res.statusText}`);
  }
  return res.json();
}

export async function createTransaction(payload: CreateTransactionPayload): Promise<Transaction> {
  const res = await fetch(`${API_BASE_URL}/finance/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to create transaction: ${res.statusText}`);
  }
  return res.json();
}

export async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE_URL}/products`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.statusText}`);
  }
  const data = await res.json();
  return data.map((item: any) => ({
    ...item,
    id: String(item.id),
  }));
}

export async function createProduct(payload: Omit<Product, "id">): Promise<Product> {
  const res = await fetch(`${API_BASE_URL}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to create product: ${res.statusText}`);
  }
  const data = await res.json();
  return { ...data, id: String(data.id) };
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const res = await fetch(`${API_BASE_URL}/dashboard/metrics`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch dashboard metrics: ${res.statusText}`);
  }
  return res.json();
}
