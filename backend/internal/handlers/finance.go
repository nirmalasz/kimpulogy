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

	_ = h.DB.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE shop_id = ? AND type = ?", shopID, models.TypeIncome).Scan(&totalIncome)
	_ = h.DB.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE shop_id = ? AND type = ?", shopID, models.TypeExpense).Scan(&totalExpense)

	// Also include revenue from sales for omzet
	var salesRevenue float64
	_ = h.DB.QueryRow("SELECT COALESCE(SUM(total_nominal), 0) FROM sales WHERE shop_id = ?", shopID).Scan(&salesRevenue)

	netProfit := totalIncome - totalExpense
	if netProfit == 0 && salesRevenue > 0 {
		// Prefer real sales-driven revenue when transaction ledger is empty
		var hpp float64
		_ = h.DB.QueryRow(
			`SELECT COALESCE(SUM(s.quantity * p.cost), 0) FROM sales s JOIN products p ON p.id = s.product_id WHERE s.shop_id = ?`,
			shopID,
		).Scan(&hpp)
		netProfit = salesRevenue - hpp - totalExpense
	}

	summary := models.FinanceSummary{
		TotalIncome:  totalIncome,
		TotalExpense: totalExpense,
		TotalRevenue: totalIncome,
		NetProfit:    netProfit,
		IncomeTrend:  h.trend("transactions", shopID, string(models.TypeIncome)),
		ExpenseTrend: h.trend("transactions", shopID, string(models.TypeExpense)),
		RevenueTrend: h.salesTrend(shopID),
		ProfitTrend:  "+9%",
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(summary)
}

func (h *FinanceHandler) GetComponents(w http.ResponseWriter, r *http.Request) {
	shopID := shopIDFrom(r)

	// Omset = total income recorded (transactions Masuk includes Quick Scan sales)
	var omset, hpp, biaya float64
	_ = h.DB.QueryRow(
		"SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE shop_id = ? AND type = ?",
		shopID, models.TypeIncome,
	).Scan(&omset)
	_ = h.DB.QueryRow(
		`SELECT COALESCE(SUM(s.quantity * p.cost), 0) FROM sales s JOIN products p ON p.id = s.product_id WHERE s.shop_id = ?`,
		shopID,
	).Scan(&hpp)
	_ = h.DB.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE shop_id = ? AND type = ?", shopID, models.TypeExpense).Scan(&biaya)

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
			continue
		}
		if t, err := time.Parse("2006-01-02 15:04:05", createdAtStr); err == nil {
			tx.CreatedAt = t
		}
		transactions = append(transactions, tx)
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
func (h *FinanceHandler) trend(table string, shopID int64, txType string) string {
	now := time.Now()
	lastMonth := now.AddDate(0, -1, 0)
	prevMonth := lastMonth.AddDate(0, -1, 0)

	var current, previous float64
	_ = h.DB.QueryRow(
		"SELECT COALESCE(SUM(amount), 0) FROM "+table+" WHERE shop_id = ? AND type = ? AND created_at >= ?",
		shopID, txType, lastMonth.Format("2006-01-02 15:04:05"),
	).Scan(&current)
	_ = h.DB.QueryRow(
		"SELECT COALESCE(SUM(amount), 0) FROM "+table+" WHERE shop_id = ? AND type = ? AND created_at >= ? AND created_at < ?",
		shopID, txType, prevMonth.Format("2006-01-02 15:04:05"), lastMonth.Format("2006-01-02 15:04:05"),
	).Scan(&previous)

	if previous == 0 {
		return "+0%"
	}
	pct := (current - previous) / previous * 100
	return formatPct(pct)
}

func (h *FinanceHandler) salesTrend(shopID int64) string {
	now := time.Now()
	lastWeek := now.AddDate(0, 0, -7)
	prevWeek := now.AddDate(0, 0, -14)

	var current, previous float64
	_ = h.DB.QueryRow(
		"SELECT COALESCE(SUM(total_nominal), 0) FROM sales WHERE shop_id = ? AND sale_date >= ?",
		shopID, lastWeek.Format("2006-01-02"),
	).Scan(&current)
	_ = h.DB.QueryRow(
		"SELECT COALESCE(SUM(total_nominal), 0) FROM sales WHERE shop_id = ? AND sale_date >= ? AND sale_date < ?",
		shopID, prevWeek.Format("2006-01-02"), lastWeek.Format("2006-01-02"),
	).Scan(&previous)

	if previous == 0 {
		return "+0%"
	}
	pct := (current - previous) / previous * 100
	return formatPct(pct)
}

func formatPct(pct float64) string {
	sign := "+"
	if pct < 0 {
		sign = "-"
		pct = -pct
	}
	return sign + strconv.FormatInt(int64(pct), 10) + "%"
}