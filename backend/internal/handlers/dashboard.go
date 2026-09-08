package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"math"
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

	if err := h.DB.QueryRow("SELECT COUNT(*), COALESCE(SUM(total_amount), 0) FROM orders WHERE shop_id = ?", shopID).Scan(&totalOrders, &totalOmzet); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if err := h.DB.QueryRow("SELECT COUNT(*) FROM products WHERE shop_id = ? AND stock <= min_stock", shopID).Scan(&lowStockCount); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	rows, err := h.DB.Query("SELECT id, item, qty, total_amount, status, created_at FROM orders WHERE shop_id = ? ORDER BY created_at DESC LIMIT 5", shopID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	var recentOrders []models.Order
	defer rows.Close()
	for rows.Next() {
		var o models.Order
		var createdAtStr string
		if err := rows.Scan(&o.ID, &o.ItemName, &o.Quantity, &o.TotalAmount, &o.Status, &createdAtStr); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		o.TotalStr = fmt.Sprintf("Rp %s", formatNumber(o.TotalAmount))
		o.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAtStr)
		recentOrders = append(recentOrders, o)
	}
	if err := rows.Err(); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if recentOrders == nil {
		recentOrders = []models.Order{}
	}

	todayStr := time.Now().Format("02 Jan 2006")
	var todayIncome, todayExpense float64
	if err := h.DB.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE shop_id = ? AND type = ? AND date = ?", shopID, models.TypeIncome, todayStr).Scan(&todayIncome); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if err := h.DB.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE shop_id = ? AND type = ? AND date = ?", shopID, models.TypeExpense, todayStr).Scan(&todayExpense); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	var todayOrders int
	var totalSold float64
	if err := h.DB.QueryRow("SELECT COUNT(*) FROM orders WHERE shop_id = ? AND date(created_at, 'localtime') = date('now', 'localtime')", shopID).Scan(&todayOrders); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if err := h.DB.QueryRow("SELECT COALESCE(SUM(quantity), 0) FROM sales WHERE shop_id = ? AND sale_date = date('now', 'localtime')", shopID).Scan(&totalSold); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	metrics := models.DashboardMetrics{
		TotalOrders:   totalOrders,
		TotalOmzet:    totalOmzet,
		LowStockCount: lowStockCount,
		RecentOrders:  recentOrders,
		TodayOrders:   todayOrders,
		TodayIncome:   todayIncome,
		TodayExpense:  todayExpense,
		ProductsSold:  math.Round(totalSold),
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(metrics)
}

func (h *DashboardHandler) GetAnalytics(w http.ResponseWriter, r *http.Request) {
	shopID := shopIDFrom(r)
	now := time.Now()

	// Weekly mix (current calendar week) + this/last week series from sales
	type dayAgg struct {
		date   string
		qty    float64
		amount float64
	}
	thisAgg := map[string]*dayAgg{}
	lastAgg := map[string]*dayAgg{}

	weekday := int(now.Weekday())
	daysSinceMonday := (weekday + 6) % 7
	weekStart := now.AddDate(0, 0, -daysSinceMonday)
	thisWeekStart := weekStart.Format("2006-01-02")
	lastWeekStart := weekStart.AddDate(0, 0, -7).Format("2006-01-02")
	mixStart := now.AddDate(0, 0, -6).Format("2006-01-02")
	todayDate := now.Format("2006-01-02")

	rows, err := h.DB.Query(
		`SELECT s.sale_date, s.quantity, s.total_nominal, p.name, p.cost, p.price, COALESCE(p.unit, 'pcs')
		 FROM sales s JOIN products p ON p.id = s.product_id
		 WHERE s.shop_id = ? AND s.sale_date >= ? AND s.sale_date <= ?`,
		shopID, lastWeekStart, todayDate,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	mix := map[string]float64{}
	top := map[string]*models.TopProduct{}
	for rows.Next() {
		var saleDate, name, unit string
		var qty, amount, cost, price float64
		if err := rows.Scan(&saleDate, &qty, &amount, &name, &cost, &price, &unit); err != nil {
			continue
		}
		if _, err := time.Parse("2006-01-02", saleDate); err != nil {
			continue
		}
		if saleDate >= mixStart {
			mix[name] += amount
		}
		if saleDate >= thisWeekStart {
			key := saleDate
			a := thisAgg[key]
			if a == nil {
				a = &dayAgg{date: key}
				thisAgg[key] = a
			}
			a.qty += qty
			a.amount += amount
		} else if saleDate >= lastWeekStart {
			key := saleDate
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
			top[name] = &models.TopProduct{Name: name, Unit: models.NormalizeProductUnit(unit)}
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
	weekLabels := []string{"Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"}
	thisSeries := make([]models.SalesPoint, 7)
	lastSeries := make([]models.SalesPoint, 7)
	for i := 0; i < 7; i++ {
		d := weekStart.AddDate(0, 0, i)
		key := d.Format("2006-01-02")
		thisSeries[i] = models.SalesPoint{Date: key, Label: weekLabels[i]}
		if a := thisAgg[key]; a != nil {
			thisSeries[i].Qty = a.qty
			thisSeries[i].Amount = a.amount
		}
		lastDate := d.AddDate(0, 0, -7)
		lastKey := lastDate.Format("2006-01-02")
		lastSeries[i] = models.SalesPoint{Date: lastKey, Label: weekLabels[i]}
		if a := lastAgg[lastKey]; a != nil {
			lastSeries[i].Qty = a.qty
			lastSeries[i].Amount = a.amount
		}
	}

	// Reminders
	reminders := []models.Reminder{}
	prodRows, err := h.DB.Query(
		`SELECT name, stock, min_stock, COALESCE(unit, 'pcs'), COALESCE(expiry_date,'') FROM products WHERE shop_id = ? ORDER BY name`,
		shopID,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer prodRows.Close()
	for prodRows.Next() {
		var name, unit, expiry string
		var stock, minStock float64
		if err := prodRows.Scan(&name, &stock, &minStock, &unit, &expiry); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		unit = models.NormalizeProductUnit(unit)
		if stock <= minStock {
			reminders = append(reminders, models.Reminder{Type: "low_stock", Product: name, Info: fmt.Sprintf("tersisa %g %s", stock, unit)})
		}
		if expiry != "" {
			if expDate, err := time.ParseInLocation("2006-01-02", expiry, now.Location()); err == nil {
				today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
				if !expDate.Before(today) && expDate.Before(today.AddDate(0, 0, 7)) {
					reminders = append(reminders, models.Reminder{Type: "expiring", Product: name, Info: "kedaluwarsa dalam 7 hari"})
				}
			}
		}
	}
	if err := prodRows.Err(); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Today income from transactions only
	todayStr := time.Now().Format("02 Jan 2006")
	var todayIncome, todayExpense float64
	if err := h.DB.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE shop_id = ? AND type = ? AND date = ?", shopID, models.TypeIncome, todayStr).Scan(&todayIncome); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if err := h.DB.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE shop_id = ? AND type = ? AND date = ?", shopID, models.TypeExpense, todayStr).Scan(&todayExpense); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
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
	sign := ""
	if val < 0 {
		sign = "-"
		val = -val
	}
	intVal := int64(val)
	s := fmt.Sprintf("%d", intVal)
	if len(s) <= 3 {
		return sign + s
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
	return sign + out
}
