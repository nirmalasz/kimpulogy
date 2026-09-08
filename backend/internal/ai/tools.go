package ai

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"google.golang.org/adk/v2/agent"
	"google.golang.org/adk/v2/tool"
	"google.golang.org/adk/v2/tool/functiontool"
)

type shopContextKey struct{}

func WithShopID(ctx context.Context, shopID int64) context.Context {
	return context.WithValue(ctx, shopContextKey{}, shopID)
}

func shopIDFromContext(ctx context.Context) (int64, error) {
	shopID, ok := ctx.Value(shopContextKey{}).(int64)
	if !ok || shopID <= 0 {
		return 0, fmt.Errorf("shop context missing")
	}
	return shopID, nil
}

type emptyArgs struct{}

type searchProductsArgs struct {
	Query string `json:"query" jsonschema:"Product name, SKU, or barcode to search for"`
}

type stockItem struct {
	Name     string `json:"name"`
	Stock    int    `json:"stock"`
	MinStock int    `json:"min_stock"`
	Status   string `json:"status"`
}

type stockResult struct {
	Status   string      `json:"status"`
	Total    int         `json:"total_products"`
	LowStock int         `json:"low_stock_count"`
	Items    []stockItem `json:"items"`
}

type productResult struct {
	Name     string  `json:"name"`
	Category string  `json:"category"`
	SKU      string  `json:"sku"`
	Barcode  string  `json:"barcode"`
	Stock    int     `json:"stock"`
	MinStock int     `json:"min_stock"`
	Price    float64 `json:"price"`
}

type financeResult struct {
	Status      string  `json:"status"`
	Income      float64 `json:"income"`
	Expense     float64 `json:"expense"`
	Revenue     float64 `json:"revenue"`
	HPP         float64 `json:"hpp"`
	GrossProfit float64 `json:"gross_profit"`
	NetProfit   float64 `json:"net_profit"`
}

type forecastItem struct {
	Name              string  `json:"name"`
	CurrentStock      int     `json:"current_stock"`
	MinimumStock      int     `json:"minimum_stock"`
	AverageDailySales float64 `json:"average_daily_sales"`
	Recommended       float64 `json:"recommended_restock"`
}

type forecastResult struct {
	Status string         `json:"status"`
	Items  []forecastItem `json:"items"`
}

type notificationResult struct {
	Status string   `json:"status"`
	Items  []string `json:"items"`
}

type dashboardResult struct {
	Status       string  `json:"status"`
	TodayIncome  float64 `json:"today_income"`
	TodayExpense float64 `json:"today_expense"`
	TodaySold    float64 `json:"today_sold"`
}

type toolSet struct {
	db *sql.DB
}

func newTools(db *sql.DB) ([]tool.Tool, error) {
	t := &toolSet{db: db}
	stock, err := functiontool.New(functiontool.Config{
		Name:        "get_stock_summary",
		Description: "Returns current stock totals and the products at or below minimum stock.",
	}, t.stock)
	if err != nil {
		return nil, err
	}
	search, err := functiontool.New(functiontool.Config{
		Name:        "search_products",
		Description: "Searches products by name, SKU, or barcode within the current shop.",
	}, t.searchProducts)
	if err != nil {
		return nil, err
	}
	finance, err := functiontool.New(functiontool.Config{
		Name:        "get_finance_summary",
		Description: "Returns verified revenue, HPP, expenses, gross profit, and net profit for the current shop.",
	}, t.finance)
	if err != nil {
		return nil, err
	}
	forecast, err := functiontool.New(functiontool.Config{
		Name:        "get_restock_forecast",
		Description: "Returns products needing restock using recent sales and minimum stock levels.",
	}, t.forecast)
	if err != nil {
		return nil, err
	}
	notifications, err := functiontool.New(functiontool.Config{
		Name:        "get_notifications",
		Description: "Returns low-stock and near-expiry notifications for the current shop.",
	}, t.notifications)
	if err != nil {
		return nil, err
	}
	dashboard, err := functiontool.New(functiontool.Config{
		Name:        "get_dashboard_metrics",
		Description: "Returns today's verified sales, income, and expenses for the current shop.",
	}, t.dashboard)
	if err != nil {
		return nil, err
	}
	return []tool.Tool{stock, search, finance, forecast, notifications, dashboard}, nil
}

func (t *toolSet) stock(ctx agent.Context, _ emptyArgs) (stockResult, error) {
	shopID, err := shopIDFromContext(ctx)
	if err != nil {
		return stockResult{}, err
	}
	var total, low int
	if err := t.db.QueryRow("SELECT COUNT(*) FROM products WHERE shop_id = ?", shopID).Scan(&total); err != nil {
		return stockResult{}, err
	}
	if err := t.db.QueryRow("SELECT COUNT(*) FROM products WHERE shop_id = ? AND stock <= min_stock", shopID).Scan(&low); err != nil {
		return stockResult{}, err
	}
	rows, err := t.db.Query("SELECT name, stock, min_stock FROM products WHERE shop_id = ? AND stock <= min_stock ORDER BY stock ASC LIMIT 10", shopID)
	if err != nil {
		return stockResult{}, err
	}
	defer rows.Close()
	items := make([]stockItem, 0)
	for rows.Next() {
		var item stockItem
		if err := rows.Scan(&item.Name, &item.Stock, &item.MinStock); err != nil {
			return stockResult{}, err
		}
		item.Status = "menipis"
		if item.Stock == 0 {
			item.Status = "habis"
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return stockResult{}, err
	}
	return stockResult{Status: "success", Total: total, LowStock: low, Items: items}, nil
}

func (t *toolSet) searchProducts(ctx agent.Context, args searchProductsArgs) ([]productResult, error) {
	shopID, err := shopIDFromContext(ctx)
	if err != nil {
		return nil, err
	}
	query := strings.TrimSpace(strings.ToLower(args.Query))
	if query == "" {
		return []productResult{}, nil
	}
	pattern := "%" + query + "%"
	rows, err := t.db.Query(
		`SELECT name, category, COALESCE(sku,''), COALESCE(barcode,''), stock, min_stock, price
		 FROM products
		 WHERE shop_id = ? AND (LOWER(name) LIKE ? OR LOWER(COALESCE(sku,'')) LIKE ? OR LOWER(COALESCE(barcode,'')) LIKE ?)
		 ORDER BY name LIMIT 10`,
		shopID, pattern, pattern, pattern,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	results := make([]productResult, 0)
	for rows.Next() {
		var item productResult
		if err := rows.Scan(&item.Name, &item.Category, &item.SKU, &item.Barcode, &item.Stock, &item.MinStock, &item.Price); err != nil {
			return nil, err
		}
		results = append(results, item)
	}
	return results, rows.Err()
}

func (t *toolSet) finance(ctx agent.Context, _ emptyArgs) (financeResult, error) {
	shopID, err := shopIDFromContext(ctx)
	if err != nil {
		return financeResult{}, err
	}
	var income, expense, revenue, hpp float64
	queries := []struct {
		query string
		dest  *float64
	}{
		{"SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE shop_id = ? AND type = 'Masuk'", &income},
		{"SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE shop_id = ? AND type = 'Keluar'", &expense},
		{"SELECT COALESCE(SUM(total_nominal), 0) FROM sales WHERE shop_id = ?", &revenue},
		{"SELECT COALESCE(SUM(s.quantity * p.cost), 0) FROM sales s JOIN products p ON p.id = s.product_id WHERE s.shop_id = ?", &hpp},
	}
	for _, item := range queries {
		if err := t.db.QueryRow(item.query, shopID).Scan(item.dest); err != nil {
			return financeResult{}, err
		}
	}
	if revenue == 0 {
		revenue = income
	}
	gross := revenue - hpp
	return financeResult{
		Status: "success", Income: income, Expense: expense, Revenue: revenue,
		HPP: hpp, GrossProfit: gross, NetProfit: gross - expense,
	}, nil
}

func (t *toolSet) forecast(ctx agent.Context, _ emptyArgs) (forecastResult, error) {
	shopID, err := shopIDFromContext(ctx)
	if err != nil {
		return forecastResult{}, err
	}
	cutoff := time.Now().In(time.Local).AddDate(0, 0, -6).Format("2006-01-02")
	rows, err := t.db.Query(
		`SELECT p.name, p.stock, p.min_stock, COALESCE(SUM(s.quantity), 0)
		 FROM products p
		 LEFT JOIN sales s ON s.product_id = p.id AND s.shop_id = p.shop_id AND s.sale_date >= ?
		 WHERE p.shop_id = ? GROUP BY p.id, p.name, p.stock, p.min_stock ORDER BY p.stock ASC`,
		cutoff, shopID,
	)
	if err != nil {
		return forecastResult{}, err
	}
	defer rows.Close()
	items := make([]forecastItem, 0)
	for rows.Next() {
		var item forecastItem
		var recentSales float64
		if err := rows.Scan(&item.Name, &item.CurrentStock, &item.MinimumStock, &recentSales); err != nil {
			return forecastResult{}, err
		}
		item.AverageDailySales = recentSales / 7
		item.Recommended = item.AverageDailySales*7 - float64(item.CurrentStock)
		if minimum := float64(item.MinimumStock - item.CurrentStock); minimum > item.Recommended {
			item.Recommended = minimum
		}
		if item.Recommended > 0 {
			items = append(items, item)
		}
	}
	return forecastResult{Status: "success", Items: items}, rows.Err()
}

func (t *toolSet) notifications(ctx agent.Context, _ emptyArgs) (notificationResult, error) {
	shopID, err := shopIDFromContext(ctx)
	if err != nil {
		return notificationResult{}, err
	}
	rows, err := t.db.Query("SELECT name, stock, min_stock, COALESCE(expiry_date,'') FROM products WHERE shop_id = ? ORDER BY name", shopID)
	if err != nil {
		return notificationResult{}, err
	}
	defer rows.Close()
	items := make([]string, 0)
	now := time.Now().In(time.Local)
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	for rows.Next() {
		var name, expiry string
		var stock, minStock int
		if err := rows.Scan(&name, &stock, &minStock, &expiry); err != nil {
			return notificationResult{}, err
		}
		if stock <= minStock {
			items = append(items, fmt.Sprintf("%s: stok %d dari minimum %d", name, stock, minStock))
		}
		if expiry != "" {
			if date, parseErr := time.ParseInLocation("2006-01-02", expiry, time.Local); parseErr == nil && !date.Before(today) && date.Before(today.AddDate(0, 0, 7)) {
				items = append(items, fmt.Sprintf("%s: kedaluwarsa %s", name, expiry))
			}
		}
	}
	return notificationResult{Status: "success", Items: items}, rows.Err()
}

func (t *toolSet) dashboard(ctx agent.Context, _ emptyArgs) (dashboardResult, error) {
	shopID, err := shopIDFromContext(ctx)
	if err != nil {
		return dashboardResult{}, err
	}
	today := time.Now().Format("02 Jan 2006")
	var income, expense, sold float64
	if err := t.db.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE shop_id = ? AND type = 'Masuk' AND date = ?", shopID, today).Scan(&income); err != nil {
		return dashboardResult{}, err
	}
	if err := t.db.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE shop_id = ? AND type = 'Keluar' AND date = ?", shopID, today).Scan(&expense); err != nil {
		return dashboardResult{}, err
	}
	if err := t.db.QueryRow("SELECT COALESCE(SUM(quantity), 0) FROM sales WHERE shop_id = ? AND sale_date = date('now', 'localtime')", shopID).Scan(&sold); err != nil {
		return dashboardResult{}, err
	}
	return dashboardResult{Status: "success", TodayIncome: income, TodayExpense: expense, TodaySold: sold}, nil
}
