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
	shopID := shopIDFrom(r)
	rows, err := h.DB.Query(
		"SELECT id, name, category, price, cost, stock, COALESCE(sku, ''), COALESCE(expiry_date, ''), min_stock, created_at, updated_at FROM products WHERE shop_id = ? ORDER BY id ASC",
		shopID,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var products []models.Product
	for rows.Next() {
		var p models.Product
		var createdStr, updatedStr string
		if err := rows.Scan(&p.ID, &p.Name, &p.Category, &p.Price, &p.Cost, &p.Stock, &p.SKU, &p.ExpiryDate, &p.MinStock, &createdStr, &updatedStr); err != nil {
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

func (h *ProductHandler) GetBySKU(w http.ResponseWriter, r *http.Request) {
	shopID := shopIDFrom(r)
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 5 || parts[3] != "sku" {
		http.NotFound(w, r)
		return
	}

	sku := parts[4]
	var p models.Product
	var createdStr, updatedStr string
	err := h.DB.QueryRow(
		"SELECT id, name, category, price, cost, stock, COALESCE(sku, ''), COALESCE(expiry_date, ''), min_stock, created_at, updated_at FROM products WHERE shop_id = ? AND (sku = ? OR barcode = ?) LIMIT 1",
		shopID, sku, sku,
	).Scan(&p.ID, &p.Name, &p.Category, &p.Price, &p.Cost, &p.Stock, &p.SKU, &p.ExpiryDate, &p.MinStock, &createdStr, &updatedStr)
	if err == sql.ErrNoRows {
		http.NotFound(w, r)
		return
	} else if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	p.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdStr)
	p.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedStr)

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(p)
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

	if req.MinStock <= 0 {
		req.MinStock = 10
	}

	// Reject duplicate SKU within the shop (when provided)
	if strings.TrimSpace(req.SKU) != "" {
		var dup int
		if err := h.DB.QueryRow(
			"SELECT COUNT(*) FROM products WHERE shop_id = ? AND LOWER(sku) = LOWER(?)",
			shopIDFrom(r), strings.TrimSpace(req.SKU),
		).Scan(&dup); err == nil && dup > 0 {
			http.Error(w, "SKU sudah dipakai produk lain", http.StatusConflict)
			return
		}
	}

	res, err := h.DB.Exec(
		"INSERT INTO products (shop_id, name, category, price, cost, stock, sku, barcode, expiry_date, min_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
		shopIDFrom(r), req.Name, req.Category, req.Price, req.Cost, req.Stock, req.SKU, req.Barcode, req.ExpiryDate, req.MinStock,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, _ := res.LastInsertId()
	product := models.Product{
		ID:        id,
		ShopID:    shopIDFrom(r),
		Name:      req.Name,
		Category:  req.Category,
		Price:     req.Price,
		Cost:      req.Cost,
		Stock:     req.Stock,
		SKU:       req.SKU,
		Barcode:   req.Barcode,
		ExpiryDate: req.ExpiryDate,
		MinStock:  req.MinStock,
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
		err := h.DB.QueryRow(
			"SELECT id, name, category, price, cost, stock, COALESCE(sku, ''), COALESCE(expiry_date, ''), min_stock, created_at, updated_at FROM products WHERE id = ? AND shop_id = ?",
			id, shopIDFrom(r),
		).Scan(&p.ID, &p.Name, &p.Category, &p.Price, &p.Cost, &p.Stock, &p.SKU, &p.ExpiryDate, &p.MinStock, &createdStr, &updatedStr)
		if err == sql.ErrNoRows {
			http.NotFound(w, r)
			return
		} else if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		p.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdStr)
		p.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedStr)

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(p)

	case http.MethodPut, http.MethodPatch:
		var req models.UpdateProductRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}
		if req.Name == "" {
			http.Error(w, "product name cannot be empty", http.StatusBadRequest)
			return
		}
		if req.MinStock <= 0 {
			req.MinStock = 10
		}

		// Reject duplicate SKU on other products within the shop
		if strings.TrimSpace(req.SKU) != "" {
			var dup int
			if err := h.DB.QueryRow(
				"SELECT COUNT(*) FROM products WHERE shop_id = ? AND LOWER(sku) = LOWER(?) AND id <> ?",
				shopIDFrom(r), strings.TrimSpace(req.SKU), id,
			).Scan(&dup); err == nil && dup > 0 {
				http.Error(w, "SKU sudah dipakai produk lain", http.StatusConflict)
				return
			}
		}

		res, err := h.DB.Exec(
			`UPDATE products SET name = ?, category = ?, price = ?, cost = ?, stock = ?,
			 sku = ?, barcode = ?, expiry_date = ?, min_stock = ?, updated_at = CURRENT_TIMESTAMP
			 WHERE id = ? AND shop_id = ?`,
			req.Name, req.Category, req.Price, req.Cost, req.Stock,
			req.SKU, req.Barcode, req.ExpiryDate, req.MinStock,
			id, shopIDFrom(r),
		)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		affected, _ := res.RowsAffected()
		if affected == 0 {
			http.NotFound(w, r)
			return
		}

		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"updated"}`))

	case http.MethodDelete:
		_, err := h.DB.Exec("DELETE FROM products WHERE id = ? AND shop_id = ?", id, shopIDFrom(r))
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
