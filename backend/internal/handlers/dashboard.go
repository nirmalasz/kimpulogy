package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"time"

	"kimpulogy/backend/internal/models"
)

type DashboardHandler struct {
	DB *sql.DB
}

func (h *DashboardHandler) GetMetrics(w http.ResponseWriter, r *http.Request) {
	shopID := shopIDFrom(r)

	var totalOrders int
	var totalOmzet float64
	var lowStockCount int

	_ = h.DB.QueryRow("SELECT COUNT(*), COALESCE(SUM(total_amount), 0) FROM orders WHERE shop_id = ?", shopID).Scan(&totalOrders, &totalOmzet)
	_ = h.DB.QueryRow("SELECT COUNT(*) FROM products WHERE shop_id = ? AND stock <= min_stock", shopID).Scan(&lowStockCount)

	rows, err := h.DB.Query("SELECT id, item, qty, total_amount, status, created_at FROM orders WHERE shop_id = ? ORDER BY created_at DESC LIMIT 5", shopID)
	var recentOrders []models.Order
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var o models.Order
			var createdAtStr string
			if err := rows.Scan(&o.ID, &o.ItemName, &o.Quantity, &o.TotalAmount, &o.Status, &createdAtStr); err == nil {
				o.TotalStr = fmt.Sprintf("Rp %s", formatNumber(o.TotalAmount))
				o.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAtStr)
				recentOrders = append(recentOrders, o)
			}
		}
	}
	if recentOrders == nil {
		recentOrders = []models.Order{}
	}

	todayStr := time.Now().Format("02 Jan 2006")
	var todayIncome, todayExpense float64
	_ = h.DB.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE shop_id = ? AND type = ? AND date = ?", shopID, models.TypeIncome, todayStr).Scan(&todayIncome)
	_ = h.DB.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE shop_id = ? AND type = ? AND date = ?", shopID, models.TypeExpense, todayStr).Scan(&todayExpense)

	// Fallback: if no transactions today, use the most recent daily value
	if todayIncome == 0 {
		_ = h.DB.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE shop_id = ? AND type = ?", shopID, models.TypeIncome).Scan(&todayIncome)
	}
	if todayExpense == 0 {
		_ = h.DB.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE shop_id = ? AND type = ?", shopID, models.TypeExpense).Scan(&todayExpense)
	}

	var totalSold int
	_ = h.DB.QueryRow("SELECT COALESCE(SUM(qty), 0) FROM orders WHERE shop_id = ?", shopID).Scan(&totalSold)

	metrics := models.DashboardMetrics{
		TotalOrders:   totalOrders,
		TotalOmzet:    totalOmzet,
		LowStockCount: lowStockCount,
		RecentOrders:  recentOrders,
		TodayOrders:   totalOrders,
		TodayIncome:   todayIncome,
		TodayExpense:  todayExpense,
		ProductsSold:  totalSold,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(metrics)
}

func (h *DashboardHandler) GetAnalytics(w http.ResponseWriter, r *http.Request) {
	shopID := shopIDFrom(r)
	now := time.Now()

	// Weekly mix (last 7 days) + this/last week series from sales
	type dayAgg struct {
		date   string
		qty    float64
		amount float64
	}
	thisAgg := map[string]*dayAgg{}
	lastAgg := map[string]*dayAgg{}

	rows, err := h.DB.Query(
		`SELECT s.sale_date, s.quantity, s.total_nominal, p.name, p.cost, p.price
		 FROM sales s JOIN products p ON p.id = s.product_id
		 WHERE s.shop_id = ? AND s.sale_date >= ?`,
		shopID, now.AddDate(0, 0, -13).Format("2006-01-02"),
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	mix := map[string]float64{}
	top := map[string]*models.TopProduct{}
	for rows.Next() {
		var saleDate, name string
		var qty, amount, cost, price float64
		if err := rows.Scan(&saleDate, &qty, &amount, &name, &cost, &price); err != nil {
			continue
		}
		date, err := time.Parse("2006-01-02", saleDate)
		if err != nil {
			continue
		}
		if now.Sub(date).Hours() <= 24*7 {
			key := date.Format("2006-01-02")
			a := thisAgg[key]
			if a == nil {
				a = &dayAgg{date: key}
				thisAgg[key] = a
			}
			a.qty += qty
			a.amount += amount
			mix[name] += qty
		} else {
			key := date.Format("2006-01-02")
			a := lastAgg[key]
			if a == nil {
				a = &dayAgg{date: key}
				lastAgg[key] = a
			}
			a.qty += qty
			a.amount += amount
		}

		// top products over the window
		if top[name] == nil {
			top[name] = &models.TopProduct{Name: name}
		}
		top[name].Quantity += qty
		top[name].Profit += qty * (price - cost)
	}

	// Build weekly mix percentages
	var totalMix float64
	for _, q := range mix {
		totalMix += q
	}
	weeklyMix := make([]models.WeeklyMix, 0, len(mix))
	for name, q := range mix {
		pct := 0.0
		if totalMix > 0 {
			pct = q / totalMix * 100
		}
		weeklyMix = append(weeklyMix, models.WeeklyMix{Label: name, Value: round1(pct)})
	}
	sort.Slice(weeklyMix, func(i, j int) bool { return weeklyMix[i].Value > weeklyMix[j].Value })

	// Top products
	topProducts := make([]models.TopProduct, 0, len(top))
	for _, tp := range top {
		tp.ProfitStr = fmt.Sprintf("Rp %s", formatNumber(tp.Profit))
		topProducts = append(topProducts, *tp)
	}
	sort.Slice(topProducts, func(i, j int) bool { return topProducts[i].Quantity > topProducts[j].Quantity })
	if len(topProducts) > 4 {
		topProducts = topProducts[:4]
	}

	// This / last week series (7 points each, day-of-week labels)
	weekLabels := []string{"Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"}
	// today index into week labels
	weekday := int(now.Weekday()) // 0 = Sunday
	thisSeries := make([]models.SalesPoint, 7)
	lastSeries := make([]models.SalesPoint, 7)
	for i := 0; i < 7; i++ {
		offsetThis := weekday - i // last i-th days back from today
		d := now.AddDate(0, 0, -offsetThis)
		key := d.Format("2006-01-02")
		thisSeries[i] = models.SalesPoint{Date: key, Label: weekLabels[(weekday-i+7)%7]}
		if a := thisAgg[key]; a != nil {
			thisSeries[i].Qty = a.qty
			thisSeries[i].Amount = a.amount
		}
		lastSeries[i] = models.SalesPoint{Date: key, Label: weekLabels[(weekday-i+7)%7]}
		if a := lastAgg[key]; a != nil {
			lastSeries[i].Qty = a.qty
			lastSeries[i].Amount = a.amount
		}
	}

	// Reminders
	reminders := []models.Reminder{}
	prodRows, err := h.DB.Query(
		`SELECT name, stock, min_stock, COALESCE(expiry_date,'') FROM products WHERE shop_id = ? ORDER BY name`,
		shopID,
	)
	if err == nil {
		defer prodRows.Close()
		for prodRows.Next() {
			var name, expiry string
			var stock, minStock int
			if err := prodRows.Scan(&name, &stock, &minStock, &expiry); err != nil {
				continue
			}
			if stock <= minStock {
				reminders = append(reminders, models.Reminder{Type: "low_stock", Product: name, Info: fmt.Sprintf("tersisa %d pcs", stock)})
			}
			if expiry != "" {
				if expDate, err := time.Parse("2006-01-02", expiry); err == nil {
					if !expDate.Before(time.Now().Truncate(24 * time.Hour)) && expDate.Before(now.AddDate(0, 0, 7)) {
						reminders = append(reminders, models.Reminder{Type: "expiring", Product: name, Info: "kedaluwarsa dalam 7 hari"})
					}
				}
			}
		}
	}

	// Today income from sales + transactions fallback
	todayStr := time.Now().Format("02 Jan 2006")
	var todayIncome, todayExpense float64
	_ = h.DB.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE shop_id = ? AND type = ? AND date = ?", shopID, models.TypeIncome, todayStr).Scan(&todayIncome)
	_ = h.DB.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE shop_id = ? AND type = ? AND date = ?", shopID, models.TypeExpense, todayStr).Scan(&todayExpense)
	if todayIncome == 0 {
		_ = h.DB.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE shop_id = ? AND type = ?", shopID, models.TypeIncome).Scan(&todayIncome)
	}
	if todayExpense == 0 {
		_ = h.DB.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE shop_id = ? AND type = ?", shopID, models.TypeExpense).Scan(&todayExpense)
	}

	analytics := models.DashboardAnalytics{
		WeeklyMix:    weeklyMix,
		ThisWeek:     thisSeries,
		LastWeek:     lastSeries,
		TopProducts:  topProducts,
		Reminders:    reminders,
		TodayIncome:  todayIncome,
		TodayExpense: todayExpense,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(analytics)
}

func round1(v float64) float64 {
	return float64(int(v*10+0.5)) / 10
}

func formatNumber(val float64) string {
	intVal := int64(val)
	s := fmt.Sprintf("%d", intVal)
	if len(s) <= 3 {
		return s
	}

	var res []string
	for len(s) > 3 {
		res = append([]string{s[len(s)-3:]}, res...)
		s = s[:len(s)-3]
	}
	if len(s) > 0 {
		res = append([]string{s}, res...)
	}

	out := ""
	for i, chunk := range res {
		if i > 0 {
			out += "."
		}
		out += chunk
	}
	return out
}