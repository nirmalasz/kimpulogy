package models

import (
	"math"
	"strings"
	"time"
)

var AllowedProductUnits = map[string]bool{
	"pcs": true, "pack": true, "box": true, "bottle": true,
	"kg": true, "g": true, "liter": true, "ml": true,
}

func NormalizeProductUnit(unit string) string {
	unit = strings.ToLower(strings.TrimSpace(unit))
	if !AllowedProductUnits[unit] {
		return "pcs"
	}
	return unit
}

func ProductUnitIsDiscrete(unit string) bool {
	unit = NormalizeProductUnit(unit)
	return unit == "pcs" || unit == "pack" || unit == "box" || unit == "bottle"
}

func ProductQuantityValid(value float64, unit string) bool {
	if math.IsNaN(value) || math.IsInf(value, 0) || value < 0 {
		return false
	}
	if ProductUnitIsDiscrete(unit) {
		return math.Trunc(value) == value
	}
	return math.Abs(value*100-math.Round(value*100)) < 0.000001
}

type TransactionType string

const (
	TypeIncome  TransactionType = "Masuk"
	TypeExpense TransactionType = "Keluar"
)

type Transaction struct {
	ID          int64           `json:"id"`
	ShopID      int64           `json:"shop_id"`
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

type FinanceComponent struct {
	Label string  `json:"label"`
	Value float64 `json:"value"`
}

type FinanceComponents struct {
	Rows []FinanceComponent `json:"rows"`
}

type Product struct {
	ID         int64     `json:"id"`
	ShopID     int64     `json:"shop_id"`
	Name       string    `json:"name"`
	Category   string    `json:"category"`
	Price      float64   `json:"price"`
	Cost       float64   `json:"cost"`
	Stock      float64   `json:"stock"`
	SKU        string    `json:"sku"`
	Barcode    string    `json:"barcode,omitempty"`
	ExpiryDate string    `json:"expiry_date,omitempty"`
	MinStock   float64   `json:"min_stock"`
	Unit       string    `json:"unit"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type CreateProductRequest struct {
	Name       string  `json:"name"`
	Category   string  `json:"category"`
	Price      float64 `json:"price"`
	Cost       float64 `json:"cost"`
	Stock      float64 `json:"stock"`
	SKU        string  `json:"sku"`
	Barcode    string  `json:"barcode"`
	ExpiryDate string  `json:"expiry_date"`
	MinStock   float64 `json:"min_stock"`
	Unit       string  `json:"unit"`
}

type UpdateProductStockRequest struct {
	Stock float64 `json:"stock"`
}

type UpdateProductRequest struct {
	Name       string  `json:"name"`
	Category   string  `json:"category"`
	Price      float64 `json:"price"`
	Cost       float64 `json:"cost"`
	Stock      float64 `json:"stock"`
	SKU        string  `json:"sku"`
	Barcode    string  `json:"barcode"`
	ExpiryDate string  `json:"expiry_date"`
	MinStock   float64 `json:"min_stock"`
	Unit       string  `json:"unit"`
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
	TotalOrders   int     `json:"total_orders"`
	TotalOmzet    float64 `json:"total_omzet"`
	LowStockCount int     `json:"low_stock_count"`
	RecentOrders  []Order `json:"recent_orders"`
	TodayOrders   int     `json:"today_orders"`
	TodayIncome   float64 `json:"today_income"`
	TodayExpense  float64 `json:"today_expense"`
	ProductsSold  float64 `json:"products_sold"`
}

// --- Auth ---

type RegisterRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	ShopName string `json:"shop_name"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type User struct {
	ID        int64     `json:"id"`
	ShopID    int64     `json:"shop_id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	AvatarURL string    `json:"avatar_url,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

// --- Settings ---

type UpdatePasswordRequest struct {
	OldPassword string `json:"old_password"`
	NewPassword string `json:"new_password"`
}

type UpdateShopRequest struct {
	Name string `json:"name"`
}

type UpdateProfileRequest struct {
	Name      string `json:"name"`
	Email     string `json:"email"`
	AvatarURL string `json:"avatar_url"`
}

type Shop struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Address   string    `json:"address"`
	CreatedAt time.Time `json:"created_at"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
	Shop  Shop   `json:"shop"`
}

// --- Dashboard analytics ---

type WeeklyMix struct {
	Label string  `json:"label"`
	Value float64 `json:"value"`
}

type SalesPoint struct {
	Date   string  `json:"date"`
	Label  string  `json:"label"`
	Qty    float64 `json:"qty"`
	Amount float64 `json:"amount"`
}

type TopProduct struct {
	Name      string  `json:"name"`
	Quantity  float64 `json:"qty"`
	Profit    float64 `json:"profit"`
	ProfitStr string  `json:"profit_str"`
	Unit      string  `json:"unit"`
}

type Reminder struct {
	Type    string `json:"type"` // "low_stock" | "expiring"
	Product string `json:"product"`
	Info    string `json:"info"`
}

type DashboardAnalytics struct {
	WeeklyMix    []WeeklyMix  `json:"weekly_mix"`
	ThisWeek     []SalesPoint `json:"this_week"`
	LastWeek     []SalesPoint `json:"last_week"`
	TopProducts  []TopProduct `json:"top_products"`
	Reminders    []Reminder   `json:"reminders"`
	TodayIncome  float64      `json:"today_income"`
	TodayExpense float64      `json:"today_expense"`
}

// --- Sales / Purchases ---

type SaleItem struct {
	ProductID int64   `json:"product_id"`
	Quantity  float64 `json:"qty"`
}

type CreateSalesRequest struct {
	Items []SaleItem `json:"items"`
}

type CreateSalesResponse struct {
	SalesCreated int               `json:"sales_created"`
	TotalAmount  float64           `json:"total_amount"`
	UpdatedStock map[int64]float64 `json:"updated_stock"`
}

type CreatePurchaseRequest struct {
	ProductID int64   `json:"product_id"`
	Quantity  float64 `json:"qty"`
	Cost      float64 `json:"cost"`
}

type CreatePurchaseResponse struct {
	PurchaseID int64   `json:"id"`
	ProductID  int64   `json:"product_id"`
	NewStock   float64 `json:"new_stock"`
}

// --- Notifications ---

type AppNotification struct {
	ID        string `json:"id"`
	Type      string `json:"type"` // low_stock | expiring | order | transaction
	Title     string `json:"title"`
	Body      string `json:"body"`
	Time      string `json:"time"`
	Read      bool   `json:"read"`
	Dismissed bool   `json:"dismissed,omitempty"`
}

type NotificationsResponse struct {
	Notifications []AppNotification `json:"notifications"`
	UnreadCount   int               `json:"unread_count"`
}

// --- Forecast ---

type RestockRecommendation struct {
	ProductID      int64   `json:"product_id"`
	Name           string  `json:"name"`
	SKU            string  `json:"sku"`
	CurrentStock   float64 `json:"current_stock"`
	MinStock       float64 `json:"min_stock"`
	AvgDaily       float64 `json:"avg_daily"`
	Forecast7D     float64 `json:"forecast_7d"`
	P907D          float64 `json:"p90_7d"`
	Recommended    float64 `json:"recommended_restock"`
	DaysToStockout float64 `json:"days_to_stockout"`
	Urgency        string  `json:"urgency"`    // habis | urgent | soon | ok
	Confidence     string  `json:"confidence"` // high | medium | low
	InModel        bool    `json:"in_model"`
	Unit           string  `json:"unit"`
}

type RestockResponse struct {
	Horizon         int                     `json:"horizon"`
	ModelType       string                  `json:"model_type"`
	Source          string                  `json:"source"`
	TrainedAt       string                  `json:"trained_at"`
	Recommendations []RestockRecommendation `json:"recommendations"`
}

// --- Chatbot ---

type ChatbotRequest struct {
	Message   string `json:"message"`
	SessionID string `json:"session_id,omitempty"`
	Scope     string `json:"scope,omitempty"`
}

type ChatbotResponse struct {
	Reply     string       `json:"reply"`
	SessionID string       `json:"session_id,omitempty"`
	Source    string       `json:"source,omitempty"`
	Scope     string       `json:"scope,omitempty"`
	Sources   []ChatSource `json:"sources,omitempty"`
}

type ChatSource struct {
	Title  string `json:"title"`
	URL    string `json:"url"`
	Domain string `json:"domain,omitempty"`
}

type UpdateNotificationRequest struct {
	State string `json:"state"` // read | dismissed
}

type AIInsight struct {
	Summary      string   `json:"summary"`
	Observations []string `json:"observations"`
	Actions      []string `json:"actions"`
	Confidence   string   `json:"confidence"`
	Period       string   `json:"period"`
	GeneratedAt  string   `json:"generated_at"`
}
