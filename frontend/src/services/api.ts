import { getToken, clearToken } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

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
  sku?: string;
  barcode?: string;
  expiry_date?: string;
  min_stock?: number;
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

export interface WeeklyMix {
  label: string;
  value: number;
}

export interface SalesPoint {
  date: string;
  label: string;
  qty: number;
  amount: number;
}

export interface TopProduct {
  name: string;
  qty: number;
  profit: number;
  profit_str: string;
}

export interface Reminder {
  type: "low_stock" | "expiring";
  product: string;
  info: string;
}

export interface DashboardAnalytics {
  weekly_mix: WeeklyMix[];
  this_week: SalesPoint[];
  last_week: SalesPoint[];
  top_products: TopProduct[];
  reminders: Reminder[];
  today_income: number;
  today_expense: number;
}

export interface FinanceComponent {
  label: string;
  value: number;
}

export interface FinanceComponents {
  rows: FinanceComponent[];
}

export interface User {
  id: number;
  shop_id: number;
  name: string;
  email: string;
  role: string;
}

export interface Shop {
  id: number;
  name: string;
  address: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  shop: Shop;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (res.status === 401) {
    clearToken();
  }
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json();
}

// --- Auth ---

export function login(email: string, password: string): Promise<AuthResponse> {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(payload: {
  name: string;
  email: string;
  password: string;
  shop_name?: string;
}): Promise<AuthResponse> {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMe(): Promise<AuthResponse> {
  return request("/auth/me");
}

// --- Finance ---

export function getFinanceSummary(): Promise<FinanceSummary> {
  return request("/finance/summary");
}

export function getTransactions(): Promise<Transaction[]> {
  return request("/finance/transactions");
}

export function createTransaction(payload: CreateTransactionPayload): Promise<Transaction> {
  return request("/finance/transactions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getFinanceComponents(): Promise<FinanceComponents> {
  return request("/finance/components");
}

// --- Products ---

export function getProducts(): Promise<Product[]> {
  return request<Product[]>("/products");
}

export function createProduct(payload: Omit<Product, "id">): Promise<Product> {
  return request("/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getProductBySKU(sku: string): Promise<Product> {
  return request(`/products/sku/${encodeURIComponent(sku)}`);
}

// --- Dashboard ---

export function getDashboardMetrics(): Promise<DashboardMetrics> {
  return request("/dashboard/metrics");
}

export function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  return request("/dashboard/analytics");
}

// --- Sales / Purchases ---

export interface CreateSalesPayload {
  items: { product_id: number; qty: number }[];
}

export interface CreateSalesResponse {
  sales_created: number;
  total_amount: number;
  updated_stock: Record<number, number>;
}

export function createSales(payload: CreateSalesPayload): Promise<CreateSalesResponse> {
  return request("/sales", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createPurchase(payload: { product_id: number; qty: number; cost?: number }): Promise<{
  id: number;
  product_id: number;
  new_stock: number;
}> {
  return request("/purchases", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// --- Forecast ---

export interface RestockRecommendation {
  product_id: number;
  name: string;
  sku: string;
  current_stock: number;
  min_stock: number;
  avg_daily: number;
  forecast_7d: number;
  p90_7d: number;
  recommended_restock: number;
  days_to_stockout: number;
  urgency: "habis" | "urgent" | "soon" | "ok";
  confidence: "high" | "medium" | "low";
  in_model: boolean;
}

export interface RestockResponse {
  horizon: number;
  model_type: string;
  source: string;
  trained_at: string;
  recommendations: RestockRecommendation[];
}

export function getForecastRestock(): Promise<RestockResponse> {
  return request("/forecast/restock");
}

// --- Notifications ---

export interface AppNotification {
  id: string;
  type: "low_stock" | "expiring" | "order" | "transaction";
  title: string;
  body: string;
  time: string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  unread_count: number;
}

export function getNotifications(): Promise<NotificationsResponse> {
  return request("/notifications");
}

// --- Chatbot ---

export function sendChatbotMessage(message: string): Promise<{ reply: string }> {
  return request("/chatbot/message", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

// --- Product update/delete ---

export function updateProduct(id: string, payload: Partial<Product> & { name: string }): Promise<void> {
  return request(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteProduct(id: string): Promise<void> {
  return request(`/products/${id}`, {
    method: "DELETE",
  });
}