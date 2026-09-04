package models

import "time"

type TransactionType string

const (
	TypeIncome  TransactionType = "Masuk"
	TypeExpense TransactionType = "Keluar"
)

type Transaction struct {
	ID          int64           `json:"id"`
	Type        TransactionType `json:"type"` // "Masuk" or "Keluar"
	Category    string          `json:"category"`
	Amount      float64         `json:"amount"`
	Description string          `json:"desc"`
	Date        string          `json:"date"` // e.g. "01 Sep 2026" or YYYY-MM-DD
	CreatedAt   time.Time       `json:"created_at"`
}

type CreateTransactionRequest struct {
	Type        TransactionType `json:"type"`
	Category    string          `json:"category"`
	Amount      float64         `json:"amount"`
	Description string          `json:"desc"`
	Date        string          `json:"date"`
}

type FinanceSummary struct {
	TotalIncome  float64 `json:"total_income"`
	TotalExpense float64 `json:"total_expense"`
	TotalRevenue float64 `json:"total_revenue"` // Omzet
	NetProfit    float64 `json:"net_profit"`    // Laba Bersih
	IncomeTrend  string  `json:"income_trend"`
	ExpenseTrend string  `json:"expense_trend"`
	RevenueTrend string  `json:"revenue_trend"`
	ProfitTrend  string  `json:"profit_trend"`
}

type Product struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Category  string    `json:"category"`
	Price     float64   `json:"price"`
	Cost      float64   `json:"cost"`
	Stock     int       `json:"stock"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CreateProductRequest struct {
	Name     string  `json:"name"`
	Category string  `json:"category"`
	Price    float64 `json:"price"`
	Cost     float64 `json:"cost"`
	Stock    int     `json:"stock"`
}

type UpdateProductStockRequest struct {
	Stock int `json:"stock"`
}

type Order struct {
	ID          string    `json:"id"`
	ItemName    string    `json:"item"`
	Quantity    int       `json:"qty"`
	TotalAmount float64   `json:"total_amount"`
	TotalStr    string    `json:"total"`
	Status      string    `json:"status"` // "Baru", "Diproses", "Selesai"
	CreatedAt   time.Time `json:"created_at"`
}

type DashboardMetrics struct {
	TotalOrders    int      `json:"total_orders"`
	TotalOmzet     float64  `json:"total_omzet"`
	LowStockCount  int      `json:"low_stock_count"`
	RecentOrders   []Order  `json:"recent_orders"`
	TodayOrders    int      `json:"today_orders"`
	TodayIncome    float64  `json:"today_income"`
	TodayExpense   float64  `json:"today_expense"`
	ProductsSold   int      `json:"products_sold"`
}
