package database

import (
	"database/sql"
	"fmt"
	"log"

	_ "modernc.org/sqlite"
)

func InitDB(dbPath string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	if err := createTables(db); err != nil {
		return nil, fmt.Errorf("failed to create tables: %w", err)
	}

	if err := seedInitialData(db); err != nil {
		log.Printf("Warning: failed to seed initial data: %v", err)
	}

	return db, nil
}

func createTables(db *sql.DB) error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS products (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			category TEXT NOT NULL,
			price REAL NOT NULL,
			cost REAL NOT NULL DEFAULT 0,
			stock INTEGER NOT NULL DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS transactions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			type TEXT NOT NULL, -- 'Masuk' or 'Keluar'
			category TEXT NOT NULL,
			amount REAL NOT NULL,
			description TEXT NOT NULL,
			date TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS orders (
			id TEXT PRIMARY KEY,
			item TEXT NOT NULL,
			qty INTEGER NOT NULL,
			total_amount REAL NOT NULL,
			status TEXT NOT NULL, -- 'Baru', 'Diproses', 'Selesai'
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
	}

	for _, q := range queries {
		if _, err := db.Exec(q); err != nil {
			return err
		}
	}
	return nil
}

func seedInitialData(db *sql.DB) error {
	// Seed products if empty
	var productCount int
	if err := db.QueryRow("SELECT COUNT(*) FROM products").Scan(&productCount); err == nil && productCount == 0 {
		initialProducts := []struct {
			Name     string
			Category string
			Price    float64
			Cost     float64
			Stock    int
		}{
			{"Seblak Ceker", "Makanan", 14000, 8000, 42},
			{"Indomie Goreng", "Makanan", 12000, 6000, 8},
			{"Es Teh Manis", "Minuman", 3000, 1000, 60},
			{"Kerupuk", "Camilan", 2000, 800, 120},
			{"Seblak Basah", "Makanan", 15000, 9000, 5},
		}
		for _, p := range initialProducts {
			_, _ = db.Exec(
				"INSERT INTO products (name, category, price, cost, stock) VALUES (?, ?, ?, ?, ?)",
				p.Name, p.Category, p.Price, p.Cost, p.Stock,
			)
		}
	}

	// Seed transactions if empty
	var txCount int
	if err := db.QueryRow("SELECT COUNT(*) FROM transactions").Scan(&txCount); err == nil && txCount == 0 {
		initialTransactions := []struct {
			Date string
			Desc string
			Type string
			Cat  string
			Amt  float64
		}{
			{"01 Sep 2026", "Penjualan harian", "Masuk", "Penjualan", 380000},
			{"01 Sep 2026", "Beli stok seblak", "Keluar", "Kulakan", 120000},
			{"31 Agu 2026", "Penjualan harian", "Masuk", "Penjualan", 415000},
			{"31 Agu 2026", "Beli gas & kemasan", "Keluar", "Operasional", 85000},
			{"30 Agu 2026", "Penjualan harian", "Masuk", "Penjualan", 362000},
			{"30 Agu 2026", "Beli stok minuman", "Keluar", "Kulakan", 96000},
			{"29 Agu 2026", "Penjualan harian", "Masuk", "Penjualan", 490000},
			{"29 Agu 2026", "Bayar listrik warung", "Keluar", "Operasional", 150000},
		}
		for _, tx := range initialTransactions {
			_, _ = db.Exec(
				"INSERT INTO transactions (type, category, amount, description, date) VALUES (?, ?, ?, ?, ?)",
				tx.Type, tx.Cat, tx.Amt, tx.Desc, tx.Date,
			)
		}
	}

	// Seed orders if empty
	var orderCount int
	if err := db.QueryRow("SELECT COUNT(*) FROM orders").Scan(&orderCount); err == nil && orderCount == 0 {
		initialOrders := []struct {
			ID     string
			Item   string
			Qty    int
			Total  float64
			Status string
		}{
			{"#00124", "Seblak Ceker", 2, 28000, "Selesai"},
			{"#00123", "Es Teh Manis", 3, 9000, "Diproses"},
			{"#00122", "Indomie Goreng", 1, 12000, "Baru"},
			{"#00121", "Kerupuk", 5, 10000, "Selesai"},
			{"#00120", "Seblak Basah", 2, 30000, "Diproses"},
		}
		for _, o := range initialOrders {
			_, _ = db.Exec(
				"INSERT INTO orders (id, item, qty, total_amount, status) VALUES (?, ?, ?, ?, ?)",
				o.ID, o.Item, o.Qty, o.Total, o.Status,
			)
		}
	}

	return nil
}
