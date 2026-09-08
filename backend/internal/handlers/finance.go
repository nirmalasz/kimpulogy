package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"kimpulogy/backend/internal/models"
)

type FinanceHandler struct {
	DB *sql.DB
}

func (h *FinanceHandler) GetSummary(w http.ResponseWriter, r *http.Request) {
	shopID := shopIDFrom(r)

	var totalIncome, totalExpense float64

	if err := h.DB.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE shop_id = ? AND type = ?", shopID, models.TypeIncome).Scan(&totalIncome); err != nil {
		http.Error(w, "failed to load income summary", http.StatusInternalServerError)
		return
	}
	if err := h.DB.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE shop_id = ? AND type = ?", shopID, models.TypeExpense).Scan(&totalExpense); err != nil {
		http.Error(w, "failed to load expense summary", http.StatusInternalServerError)
		return
	}

	// Also include revenue from sales for omzet
	var salesRevenue float64
	if err := h.DB.QueryRow("SELECT COALESCE(SUM(total_nominal), 0) FROM sales WHERE shop_id = ?", shopID).Scan(&salesRevenue); err != nil {
		http.Error(w, "failed to load sales summary", http.StatusInternalServerError)
		return
	}

	var hpp float64
	if err := h.DB.QueryRow(
		`SELECT COALESCE(SUM(s.quantity * p.cost), 0) FROM sales s JOIN products p ON p.id = s.product_id WHERE s.shop_id = ?`,
		shopID,
	).Scan(&hpp); err != nil {
		http.Error(w, "failed to load cost summary", http.StatusInternalServerError)
		return
	}
	useSalesRevenue := totalIncome == 0 && salesRevenue > 0
	revenue := totalIncome
	if useSalesRevenue {
		revenue = salesRevenue
	}
	netProfit := revenue - hpp - totalExpense

	incomeTrend, err := h.trend("transactions", shopID, string(models.TypeIncome))
	if err != nil {
		http.Error(w, "failed to calculate income trend", http.StatusInternalServerError)
		return
	}
	expenseTrend, err := h.trend("transactions", shopID, string(models.TypeExpense))
	if err != nil {
		http.Error(w, "failed to calculate expense trend", http.StatusInternalServerError)
		return
	}
	revenueTrend := incomeTrend
	if useSalesRevenue {
		revenueTrend, err = h.salesTrend(shopID)
		if err != nil {
			http.Error(w, "failed to calculate revenue trend", http.StatusInternalServerError)
			return
		}
	}
	profitTrend, err := h.profitTrend(shopID, useSalesRevenue)
	if err != nil {
		http.Error(w, "failed to calculate profit trend", http.StatusInternalServerError)
		return
	}

	summary := models.FinanceSummary{
		TotalIncome:  totalIncome,
		TotalExpense: totalExpense,
		TotalRevenue: revenue,
		NetProfit:    netProfit,
		IncomeTrend:  incomeTrend,
		ExpenseTrend: expenseTrend,
		RevenueTrend: revenueTrend,
		ProfitTrend:  profitTrend,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(summary)
}

func (h *FinanceHandler) GetComponents(w http.ResponseWriter, r *http.Request) {
	shopID := shopIDFrom(r)

	// Omset = total income recorded (transactions Masuk includes Quick Scan sales)
	var omset, salesRevenue, hpp, biaya float64
	if err := h.DB.QueryRow(
		"SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE shop_id = ? AND type = ?",
		shopID, models.TypeIncome,
	).Scan(&omset); err != nil {
		http.Error(w, "failed to load income components", http.StatusInternalServerError)
		return
	}
	if err := h.DB.QueryRow("SELECT COALESCE(SUM(total_nominal), 0) FROM sales WHERE shop_id = ?", shopID).Scan(&salesRevenue); err != nil {
		http.Error(w, "failed to load sales components", http.StatusInternalServerError)
		return
	}
	if err := h.DB.QueryRow(
		`SELECT COALESCE(SUM(s.quantity * p.cost), 0) FROM sales s JOIN products p ON p.id = s.product_id WHERE s.shop_id = ?`,
		shopID,
	).Scan(&hpp); err != nil {
		http.Error(w, "failed to load cost components", http.StatusInternalServerError)
		return
	}
	if err := h.DB.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE shop_id = ? AND type = ?", shopID, models.TypeExpense).Scan(&biaya); err != nil {
		http.Error(w, "failed to load expense components", http.StatusInternalServerError)
		return
	}
	if omset == 0 && salesRevenue > 0 {
		omset = salesRevenue
	}

	gross := omset - hpp
	net := gross - biaya

	rows := []models.FinanceComponent{
		{Label: "Total Pemasukan (Omset)", Value: omset},
		{Label: "Harga Pokok Penjualan (HPP)", Value: -hpp},
		{Label: "Laba Kotor (Gross Profit)", Value: gross},
		{Label: "Biaya Operasional (Listrik, karyawan)", Value: -biaya},
		{Label: "Laba Bersih (Nett profit)", Value: net},
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(models.FinanceComponents{Rows: rows})
}

func (h *FinanceHandler) GetTransactions(w http.ResponseWriter, r *http.Request) {
	shopID := shopIDFrom(r)

	rows, err := h.DB.Query(
		"SELECT id, type, category, amount, description, date, created_at FROM transactions WHERE shop_id = ? ORDER BY id DESC",
		shopID,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var transactions []models.Transaction
	for rows.Next() {
		var tx models.Transaction
		var createdAtStr string
		if err := rows.Scan(&tx.ID, &tx.Type, &tx.Category, &tx.Amount, &tx.Description, &tx.Date, &createdAtStr); err != nil {
			http.Error(w, "failed to read transactions", http.StatusInternalServerError)
			return
		}
		if t, err := time.Parse("2006-01-02 15:04:05", createdAtStr); err == nil {
			tx.CreatedAt = t
		}
		transactions = append(transactions, tx)
	}
	if err := rows.Err(); err != nil {
		http.Error(w, "failed to read transactions", http.StatusInternalServerError)
		return
	}

	if transactions == nil {
		transactions = []models.Transaction{}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(transactions)
}

func (h *FinanceHandler) CreateTransaction(w http.ResponseWriter, r *http.Request) {
	shopID := shopIDFrom(r)

	var req models.CreateTransactionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	if req.Amount <= 0 {
		http.Error(w, "amount must be greater than zero", http.StatusBadRequest)
		return
	}

	if req.Type != models.TypeIncome && req.Type != models.TypeExpense {
		http.Error(w, "type must be 'Masuk' or 'Keluar'", http.StatusBadRequest)
		return
	}

	if req.Date == "" {
		req.Date = time.Now().Format("02 Jan 2006")
	} else if parsed, err := time.Parse("2006-01-02", req.Date); err == nil {
		req.Date = parsed.Format("02 Jan 2006")
	} else if _, err := time.Parse("02 Jan 2006", req.Date); err != nil {
		http.Error(w, "date must use YYYY-MM-DD", http.StatusBadRequest)
		return
	}

	if req.Category == "" {
		if req.Type == models.TypeIncome {
			req.Category = "Penjualan"
		} else {
			req.Category = "Operasional"
		}
	}

	res, err := h.DB.Exec(
		"INSERT INTO transactions (shop_id, type, category, amount, description, date) VALUES (?, ?, ?, ?, ?, ?)",
		shopID, req.Type, req.Category, req.Amount, req.Description, req.Date,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, _ := res.LastInsertId()
	createdTx := models.Transaction{
		ID:          id,
		ShopID:      shopID,
		Type:        req.Type,
		Category:    req.Category,
		Amount:      req.Amount,
		Description: req.Description,
		Date:        req.Date,
		CreatedAt:   time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(createdTx)
}

// trend computes a period-over-period percent change for the given table/type.
func (h *FinanceHandler) trend(table string, shopID int64, txType string) (string, error) {
	current, previous, err := h.transactionTrendValues(table, shopID, txType)
	if err != nil {
		return "", err
	}

	if previous == 0 {
		return "+0%", nil
	}
	pct := (current - previous) / previous * 100
	return formatPct(pct), nil
}

func (h *FinanceHandler) profitTrend(shopID int64, salesOnly bool) (string, error) {
	var incomeCurrent, incomePrevious float64
	var err error
	if salesOnly {
		incomeCurrent, incomePrevious, err = h.salesRevenueTrendValues(shopID)
	} else {
		incomeCurrent, incomePrevious, err = h.transactionTrendValues("transactions", shopID, string(models.TypeIncome))
	}
	if err != nil {
		return "", err
	}
	expenseCurrent, expensePrevious, err := h.transactionTrendValues("transactions", shopID, string(models.TypeExpense))
	if err != nil {
		return "", err
	}
	costCurrent, costPrevious, err := h.salesCostTrendValues(shopID)
	if err != nil {
		return "", err
	}
	current := incomeCurrent - expenseCurrent - costCurrent
	previous := incomePrevious - expensePrevious - costPrevious
	if previous == 0 {
		return "+0%", nil
	}
	return formatPct((current - previous) / previous * 100), nil
}

func (h *FinanceHandler) transactionTrendValues(table string, shopID int64, txType string) (float64, float64, error) {
	now := time.Now()
	currentEnd := time.Date(now.Year(), now.Month(), now.Day()+1, 0, 0, 0, 0, now.Location())
	currentStart := currentEnd.AddDate(0, 0, -30)
	previousStart := currentStart.AddDate(0, 0, -30)

	rows, err := h.DB.Query("SELECT amount, date, created_at FROM "+table+" WHERE shop_id = ? AND type = ?", shopID, txType)
	if err != nil {
		return 0, 0, err
	}
	defer rows.Close()

	var current, previous float64
	for rows.Next() {
		var amount float64
		var dateValue, createdAt string
		if err := rows.Scan(&amount, &dateValue, &createdAt); err != nil {
			return 0, 0, err
		}
		date := parseTransactionDate(dateValue, createdAt)
		if date.IsZero() {
			continue
		}
		if !date.Before(currentStart) && date.Before(currentEnd) {
			current += amount
		} else if !date.Before(previousStart) && date.Before(currentStart) {
			previous += amount
		}
	}
	if err := rows.Err(); err != nil {
		return 0, 0, err
	}
	return current, previous, nil
}

func parseTransactionDate(dateValue, createdAt string) time.Time {
	for _, layout := range []string{"2006-01-02", "02 Jan 2006"} {
		if parsed, err := time.ParseInLocation(layout, dateValue, time.Local); err == nil {
			return parsed
		}
	}
	if parsed, err := time.Parse("2006-01-02 15:04:05", createdAt); err == nil {
		return parsed.In(time.Local)
	}
	return time.Time{}
}

func (h *FinanceHandler) salesCostTrendValues(shopID int64) (float64, float64, error) {
	now := time.Now()
	currentEnd := time.Date(now.Year(), now.Month(), now.Day()+1, 0, 0, 0, 0, now.Location())
	currentStart := currentEnd.AddDate(0, 0, -30)
	previousStart := currentStart.AddDate(0, 0, -30)

	var current, previous float64
	if err := h.DB.QueryRow(
		`SELECT COALESCE(SUM(s.quantity * p.cost), 0)
		 FROM sales s JOIN products p ON p.id = s.product_id
		 WHERE s.shop_id = ? AND s.sale_date >= ? AND s.sale_date < ?`,
		shopID, currentStart.Format("2006-01-02"), currentEnd.Format("2006-01-02"),
	).Scan(&current); err != nil {
		return 0, 0, err
	}
	if err := h.DB.QueryRow(
		`SELECT COALESCE(SUM(s.quantity * p.cost), 0)
		 FROM sales s JOIN products p ON p.id = s.product_id
		 WHERE s.shop_id = ? AND s.sale_date >= ? AND s.sale_date < ?`,
		shopID, previousStart.Format("2006-01-02"), currentStart.Format("2006-01-02"),
	).Scan(&previous); err != nil {
		return 0, 0, err
	}
	return current, previous, nil
}

func (h *FinanceHandler) salesRevenueTrendValues(shopID int64) (float64, float64, error) {
	now := time.Now()
	currentEnd := time.Date(now.Year(), now.Month(), now.Day()+1, 0, 0, 0, 0, now.Location())
	currentStart := currentEnd.AddDate(0, 0, -30)
	previousStart := currentStart.AddDate(0, 0, -30)

	var current, previous float64
	if err := h.DB.QueryRow(
		"SELECT COALESCE(SUM(total_nominal), 0) FROM sales WHERE shop_id = ? AND sale_date >= ? AND sale_date < ?",
		shopID, currentStart.Format("2006-01-02"), currentEnd.Format("2006-01-02"),
	).Scan(&current); err != nil {
		return 0, 0, err
	}
	if err := h.DB.QueryRow(
		"SELECT COALESCE(SUM(total_nominal), 0) FROM sales WHERE shop_id = ? AND sale_date >= ? AND sale_date < ?",
		shopID, previousStart.Format("2006-01-02"), currentStart.Format("2006-01-02"),
	).Scan(&previous); err != nil {
		return 0, 0, err
	}
	return current, previous, nil
}

func (h *FinanceHandler) salesTrend(shopID int64) (string, error) {
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	currentStart := today.AddDate(0, 0, -6)
	currentEnd := today.AddDate(0, 0, 1)
	previousStart := currentStart.AddDate(0, 0, -7)

	var current, previous float64
	if err := h.DB.QueryRow(
		"SELECT COALESCE(SUM(total_nominal), 0) FROM sales WHERE shop_id = ? AND sale_date >= ? AND sale_date < ?",
		shopID, currentStart.Format("2006-01-02"), currentEnd.Format("2006-01-02"),
	).Scan(&current); err != nil {
		return "", err
	}
	if err := h.DB.QueryRow(
		"SELECT COALESCE(SUM(total_nominal), 0) FROM sales WHERE shop_id = ? AND sale_date >= ? AND sale_date < ?",
		shopID, previousStart.Format("2006-01-02"), currentStart.Format("2006-01-02"),
	).Scan(&previous); err != nil {
		return "", err
	}

	if previous == 0 {
		return "+0%", nil
	}
	pct := (current - previous) / previous * 100
	return formatPct(pct), nil
}

func formatPct(pct float64) string {
	sign := "+"
	if pct < 0 {
		sign = "-"
		pct = -pct
	}
	return sign + strconv.FormatInt(int64(pct), 10) + "%"
}
