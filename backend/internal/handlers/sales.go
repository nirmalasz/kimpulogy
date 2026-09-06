package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"kimpulogy/backend/internal/models"
)

type SalesHandler struct {
	DB *sql.DB
}

func (h *SalesHandler) CreateSales(w http.ResponseWriter, r *http.Request) {
	shopID := shopIDFrom(r)

	var req models.CreateSalesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}
	if len(req.Items) == 0 {
		writeError(w, http.StatusBadRequest, "items cannot be empty")
		return
	}

	tx, err := h.DB.Begin()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer tx.Rollback()

	today := time.Now().Format("2006-01-02")
	todayDisplay := time.Now().Format("02 Jan 2006")
	var totalAmount float64
	salesCreated := 0
	updatedStock := map[int64]int{}

	for _, item := range req.Items {
		if item.ProductID <= 0 || item.Quantity <= 0 {
			writeError(w, http.StatusBadRequest, "invalid product_id or qty")
			return
		}

		var price float64
		var stock int
		err := tx.QueryRow("SELECT price, stock FROM products WHERE id = ? AND shop_id = ?", item.ProductID, shopID).
			Scan(&price, &stock)
		if err == sql.ErrNoRows {
			writeError(w, http.StatusNotFound, "product not found")
			return
		} else if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		amount := item.Quantity * price
		totalAmount += amount

		if _, err := tx.Exec(
			"INSERT INTO sales (shop_id, product_id, quantity, unit_price, total_nominal, sale_date) VALUES (?, ?, ?, ?, ?, ?)",
			shopID, item.ProductID, item.Quantity, price, amount, today,
		); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		newStock := stock - int(item.Quantity)
		if newStock < 0 {
			newStock = 0
		}
		if _, err := tx.Exec(
			"UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND shop_id = ?",
			newStock, item.ProductID, shopID,
		); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		updatedStock[item.ProductID] = newStock
		salesCreated++
	}

	// Record aggregate income transaction
	if _, err := tx.Exec(
		"INSERT INTO transactions (shop_id, type, category, amount, description, date) VALUES (?, ?, ?, ?, ?, ?)",
		shopID, models.TypeIncome, "Penjualan", totalAmount, "Penjualan harian (Quick Scan)", todayDisplay,
	); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := tx.Commit(); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(models.CreateSalesResponse{
		SalesCreated: salesCreated,
		TotalAmount:  totalAmount,
		UpdatedStock: updatedStock,
	})
}

func (h *SalesHandler) CreatePurchase(w http.ResponseWriter, r *http.Request) {
	shopID := shopIDFrom(r)

	var req models.CreatePurchaseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}
	if req.ProductID <= 0 || req.Quantity <= 0 {
		writeError(w, http.StatusBadRequest, "product_id and qty must be positive")
		return
	}

	tx, err := h.DB.Begin()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer tx.Rollback()

	var stock int
	var price float64
	err = tx.QueryRow("SELECT stock, price FROM products WHERE id = ? AND shop_id = ?", req.ProductID, shopID).
		Scan(&stock, &price)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "product not found")
		return
	} else if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	cost := req.Cost
	if cost <= 0 {
		cost = price
	}

	res, err := tx.Exec(
		"INSERT INTO purchases (shop_id, product_id, quantity, purchase_date) VALUES (?, ?, ?, ?)",
		shopID, req.ProductID, req.Quantity, time.Now().Format("2006-01-02"),
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	purchaseID, _ := res.LastInsertId()

	newStock := stock + int(req.Quantity)
	if _, err := tx.Exec(
		"UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND shop_id = ?",
		newStock, req.ProductID, shopID,
	); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if _, err := tx.Exec(
		"INSERT INTO transactions (shop_id, type, category, amount, description, date) VALUES (?, ?, ?, ?, ?, ?)",
		shopID, models.TypeExpense, "Kulakan", cost*req.Quantity, fmt.Sprintf("Beli stok (produk #%d)", req.ProductID), time.Now().Format("02 Jan 2006"),
	); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := tx.Commit(); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(models.CreatePurchaseResponse{
		PurchaseID: purchaseID,
		ProductID:  req.ProductID,
		NewStock:   newStock,
	})
}