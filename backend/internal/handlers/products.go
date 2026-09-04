package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"kimpulogy/backend/internal/models"
)

type ProductHandler struct {
	DB *sql.DB
}

func (h *ProductHandler) GetProducts(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query("SELECT id, name, category, price, cost, stock, created_at, updated_at FROM products ORDER BY id ASC")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var products []models.Product
	for rows.Next() {
		var p models.Product
		var createdStr, updatedStr string
		if err := rows.Scan(&p.ID, &p.Name, &p.Category, &p.Price, &p.Cost, &p.Stock, &createdStr, &updatedStr); err != nil {
			continue
		}
		p.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdStr)
		p.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedStr)
		products = append(products, p)
	}

	if products == nil {
		products = []models.Product{}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(products)
}

func (h *ProductHandler) CreateProduct(w http.ResponseWriter, r *http.Request) {
	var req models.CreateProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(req.Name) == "" {
		http.Error(w, "product name cannot be empty", http.StatusBadRequest)
		return
	}

	res, err := h.DB.Exec(
		"INSERT INTO products (name, category, price, cost, stock) VALUES (?, ?, ?, ?, ?)",
		req.Name, req.Category, req.Price, req.Cost, req.Stock,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, _ := res.LastInsertId()
	product := models.Product{
		ID:        id,
		Name:      req.Name,
		Category:  req.Category,
		Price:     req.Price,
		Cost:      req.Cost,
		Stock:     req.Stock,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(product)
}

func (h *ProductHandler) HandleProductByID(w http.ResponseWriter, r *http.Request) {
	// Path like /api/v1/products/{id}
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 4 {
		http.NotFound(w, r)
		return
	}

	idStr := parts[3]
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, "invalid product id", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodGet:
		var p models.Product
		var createdStr, updatedStr string
		err := h.DB.QueryRow("SELECT id, name, category, price, cost, stock, created_at, updated_at FROM products WHERE id = ?", id).
			Scan(&p.ID, &p.Name, &p.Category, &p.Price, &p.Cost, &p.Stock, &createdStr, &updatedStr)
		if err == sql.ErrNoRows {
			http.NotFound(w, r)
			return
		} else if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(p)

	case http.MethodPut, http.MethodPatch:
		var req models.UpdateProductStockRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		_, err := h.DB.Exec("UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", req.Stock, id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"updated"}`))

	case http.MethodDelete:
		_, err := h.DB.Exec("DELETE FROM products WHERE id = ?", id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"deleted"}`))

	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}
