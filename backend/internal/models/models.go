package models

import "time"

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
	Stock      int       `json:"stock"`
	SKU        string    `json:"sku"`
	Barcode    string    `json:"barcode,omitempty"`
	ExpiryDate string    `json:"expiry_date,omitempty"`
	MinStock   int       `json:"min_stock"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type CreateProductRequest struct {
	Name       string  `json:"name"`
	Category   string  `json:"category"`
	Price      float64 `json:"price"`
	Cost       float64 `json:"cost"`
	Stock      int     `json:"stock"`
	SKU        string  `json:"sku"`
	Barcode    string  `json:"barcode"`
	ExpiryDate string  `json:"expiry_date"`
	MinStock   int     `json:"min_stock"`
}

type UpdateProductStockRequest struct {
	Stock int `json:"stock"`
}

type UpdateProductRequest struct {
	Name       string  `json:"name"`
	Category   string  `json:"category"`
	Price      float64 `json:"price"`
	Cost       float64 `json:"cost"`
	Stock      int     `json:"stock"`
	SKU        string  `json:"sku"`
	Barcode    string  `json:"barcode"`
	ExpiryDate string  `json:"expiry_date"`
	MinStock   int     `json:"min_stock"`
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
	TotalOrders   int      `json:"total_orders"`
	TotalOmzet    float64  `json:"total_omzet"`
	LowStockCount int      `json:"low_stock_count"`
	RecentOrders  []Order  `json:"recent_orders"`
	TodayOrders   int      `json:"today_orders"`
	TodayIncome   float64  `json:"today_income"`
	TodayExpense  float64  `json:"today_expense"`
	ProductsSold  int      `json:"products_sold"`
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
	SalesCreated int     `json:"sales_created"`
	TotalAmount  float64 `json:"total_amount"`
	UpdatedStock map[int64]int `json:"updated_stock"`
}

type CreatePurchaseRequest struct {
	ProductID int64   `json:"product_id"`
	Quantity  float64 `json:"qty"`
	Cost      float64 `json:"cost"`
}

type CreatePurchaseResponse struct {
	PurchaseID  int64 `json:"id"`
	ProductID   int64 `json:"product_id"`
	NewStock    int   `json:"new_stock"`
}

// --- Notifications ---

type AppNotification struct {
	ID    string `json:"id"`
	Type  string `json:"type"` // low_stock | expiring | order | transaction
	Title string `json:"title"`
	Body  string `json:"body"`
	Time  string `json:"time"`
}

type NotificationsResponse struct {
	Notifications []AppNotification `json:"notifications"`
	UnreadCount   int               `json:"unread_count"`
}

// --- Forecast ---

type RestockRecommendation struct {
	ProductID         int64   `json:"product_id"`
	Name              string  `json:"name"`
	SKU               string  `json:"sku"`
	CurrentStock      int     `json:"current_stock"`
	MinStock          int     `json:"min_stock"`
	AvgDaily          float64 `json:"avg_daily"`
	Forecast7D        float64 `json:"forecast_7d"`
	P907D             float64 `json:"p90_7d"`
	Recommended       int     `json:"recommended_restock"`
	DaysToStockout    float64 `json:"days_to_stockout"`
	Urgency           string  `json:"urgency"` // habis | urgent | soon | ok
	Confidence        string  `json:"confidence"` // high | medium | low
	InModel           bool    `json:"in_model"`
}

type RestockResponse struct {
	Horizon      int                    `json:"horizon"`
	ModelType    string                 `json:"model_type"`
	Source       string                 `json:"source"`
	TrainedAt    string                 `json:"trained_at"`
	Recommendations []RestockRecommendation `json:"recommendations"`
}

// --- Chatbot ---

type ChatbotRequest struct {
	Message string `json:"message"`
}

type ChatbotResponse struct {
	Reply string `json:"reply"`
}