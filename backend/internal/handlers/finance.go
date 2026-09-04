package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"kimpulogy/backend/internal/models"
)

type FinanceHandler struct {
	DB *sql.DB
}

func (h *FinanceHandler) GetSummary(w http.ResponseWriter, r *http.Request) {
	var totalIncome, totalExpense float64

	// Query total income
	_ = h.DB.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = ?", models.TypeIncome).Scan(&totalIncome)

	// Query total expense
	_ = h.DB.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = ?", models.TypeExpense).Scan(&totalExpense)

	// In warung accounting, Total Omzet = Total Income, Laba Bersih = Total Income - Total Expense
	netProfit := totalIncome - totalExpense

	summary := models.FinanceSummary{
		TotalIncome:  totalIncome,
		TotalExpense: totalExpense,
		TotalRevenue: totalIncome,
		NetProfit:    netProfit,
		IncomeTrend:  "+18%",
		ExpenseTrend: "+6%",
		RevenueTrend: "+21%",
		ProfitTrend:  "+9%",
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(summary)
}

func (h *FinanceHandler) GetTransactions(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query("SELECT id, type, category, amount, description, date, created_at FROM transactions ORDER BY id DESC")
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
		"INSERT INTO transactions (type, category, amount, description, date) VALUES (?, ?, ?, ?, ?)",
		req.Type, req.Category, req.Amount, req.Description, req.Date,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, _ := res.LastInsertId()
	createdTx := models.Transaction{
		ID:          id,
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
