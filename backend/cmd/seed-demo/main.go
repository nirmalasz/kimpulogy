package main

import (
	"database/sql"
	"flag"
	"fmt"
	"math"
	"os"
	"time"

	"golang.org/x/crypto/bcrypt"

	"kimpulogy/backend/internal/database"
)

type demoProduct struct {
	Name     string
	Category string
	Price    float64
	Cost     float64
	Stock    float64
	Unit     string
	MinStock float64
	SKU      string
	Barcode  string
	Expiry   string
	BaseSale float64
}

func main() {
	dbPath := flag.String("db", "demo-larisin.db", "demo SQLite database path")
	reset := flag.Bool("reset", false, "delete and recreate the demo database")
	flag.Parse()

	if _, err := os.Stat(*dbPath); err == nil && !*reset {
		fmt.Printf("database %s already exists; rerun with --reset to replace it\n", *dbPath)
		os.Exit(1)
	}
	if *reset {
		if err := os.Remove(*dbPath); err != nil && !os.IsNotExist(err) {
			fatal(err)
		}
	}

	db, err := database.InitDB(*dbPath)
	if err != nil {
		fatal(err)
	}
	defer db.Close()

	if err := seed(db); err != nil {
		fatal(err)
	}

	fmt.Printf("demo database ready: %s\n", *dbPath)
	fmt.Println("email: demo@larisin.id")
	fmt.Println("password: larisin123")
}

func seed(db *sql.DB) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	for _, table := range []string{"notification_states", "sales", "purchases", "transactions", "orders", "products"} {
		if _, err := tx.Exec("DELETE FROM " + table); err != nil {
			return fmt.Errorf("clear %s: %w", table, err)
		}
	}

	hash, err := bcrypt.GenerateFromPassword([]byte("larisin123"), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("hash demo password: %w", err)
	}
	if _, err := tx.Exec(
		"UPDATE shops SET name = ?, address = ? WHERE id = 1",
		"Warung Demo LARISIN", "Depok, Jawa Barat",
	); err != nil {
		return fmt.Errorf("update demo shop: %w", err)
	}
	if _, err := tx.Exec(
		"UPDATE users SET name = ?, email = ?, password_hash = ?, role = ?, avatar_url = ? WHERE id = 1",
		"Demo Owner", "demo@larisin.id", string(hash), "owner", "",
	); err != nil {
		return fmt.Errorf("update demo user: %w", err)
	}

	now := time.Now()
	products := []demoProduct{
		{Name: "Seblak Ceker", Category: "Makanan", Price: 14000, Cost: 8000, Stock: 9, Unit: "pcs", MinStock: 10, SKU: "SBK-CKR-01", Barcode: "899100000001", BaseSale: 5},
		{Name: "Indomie Goreng", Category: "Makanan", Price: 12000, Cost: 6000, Stock: 8, Unit: "pcs", MinStock: 10, SKU: "IDM-GRG-01", Barcode: "899100000002", BaseSale: 7},
		{Name: "Es Teh Manis", Category: "Minuman", Price: 3000, Cost: 1000, Stock: 60, Unit: "pcs", MinStock: 10, SKU: "TEH-MNS-01", Barcode: "899100000003", BaseSale: 14},
		{Name: "Kerupuk", Category: "Camilan", Price: 2000, Cost: 800, Stock: 120, Unit: "pcs", MinStock: 20, SKU: "KRP-001-01", Barcode: "899100000004", BaseSale: 8},
		{Name: "Seblak Basah", Category: "Makanan", Price: 15000, Cost: 9000, Stock: 5, Unit: "pcs", MinStock: 10, SKU: "SBK-BSH-01", Barcode: "899100000005", BaseSale: 5},
		{Name: "Minyak Goreng Bimoli", Category: "Sembako", Price: 18000, Cost: 15000, Stock: 1.5, Unit: "liter", MinStock: 3, SKU: "MGB-2477-14", Barcode: "899100000006", BaseSale: 0.8},
		{Name: "Sirup Marjan", Category: "Minuman", Price: 18000, Cost: 15000, Stock: 12, Unit: "bottle", MinStock: 5, SKU: "SRP-MRJ-01", Barcode: "899100000007", BaseSale: 1.5},
		{Name: "Sambal UMKM Depok", Category: "Produk Lokal", Price: 18000, Cost: 11000, Stock: 4, Unit: "pack", MinStock: 8, SKU: "SBL-DPK-01", Barcode: "899100000008", Expiry: now.AddDate(0, 0, 5).Format("2006-01-02"), BaseSale: 1.2},
		{Name: "Kopi Susu Literan", Category: "Minuman", Price: 25000, Cost: 14000, Stock: 0, Unit: "liter", MinStock: 2, SKU: "KSL-001-01", Barcode: "899100000009", BaseSale: 0.7},
	}

	ids := make(map[string]int64, len(products))
	for _, product := range products {
		res, err := tx.Exec(
			`INSERT INTO products (shop_id, name, category, price, cost, stock, unit, sku, barcode, expiry_date, min_stock)
			 VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			product.Name, product.Category, product.Price, product.Cost, product.Stock, product.Unit,
			product.SKU, product.Barcode, product.Expiry, product.MinStock,
		)
		if err != nil {
			return fmt.Errorf("insert product %s: %w", product.Name, err)
		}
		id, err := res.LastInsertId()
		if err != nil {
			return err
		}
		ids[product.Name] = id
	}

	if err := seedSales(tx, products, ids, now); err != nil {
		return err
	}
	if err := seedTransactions(tx, now); err != nil {
		return err
	}
	if err := seedPurchases(tx, ids, now); err != nil {
		return err
	}
	if err := seedOrders(tx); err != nil {
		return err
	}

	return tx.Commit()
}

func seedSales(tx *sql.Tx, products []demoProduct, ids map[string]int64, now time.Time) error {
	for daysAgo := 45; daysAgo >= 0; daysAgo-- {
		date := now.AddDate(0, 0, -daysAgo)
		weekdayFactor := 1.0
		if date.Weekday() == time.Friday || date.Weekday() == time.Saturday {
			weekdayFactor = 1.25
		}
		for _, product := range products {
			quantity := math.Round(product.BaseSale*weekdayFactor*100) / 100
			if quantity <= 0 || (len(product.Name)+daysAgo)%13 == 0 {
				continue
			}
			if _, err := tx.Exec(
				`INSERT INTO sales (shop_id, product_id, quantity, unit_price, total_nominal, sale_date)
				 VALUES (1, ?, ?, ?, ?, ?)`,
				ids[product.Name], quantity, product.Price, quantity*product.Price, date.Format("2006-01-02"),
			); err != nil {
				return fmt.Errorf("insert sale: %w", err)
			}
		}
	}
	return nil
}

func seedTransactions(tx *sql.Tx, now time.Time) error {
	type transaction struct {
		daysAgo int
		typ     string
		cat     string
		amount  float64
		desc    string
	}
	rows := []transaction{
		{0, "Masuk", "Penjualan", 1285000, "Penjualan hari ini"},
		{0, "Keluar", "Operasional", 180000, "Belanja gas dan kemasan"},
		{1, "Masuk", "Penjualan", 1040000, "Penjualan harian"},
		{2, "Keluar", "Kulakan", 625000, "Belanja stok sembako"},
		{3, "Masuk", "Penjualan", 1180000, "Penjualan akhir pekan"},
		{5, "Keluar", "Gaji", 450000, "Upah bantuan warung"},
		{7, "Masuk", "Penjualan", 960000, "Penjualan harian"},
		{10, "Keluar", "Operasional", 210000, "Bayar listrik warung"},
		{14, "Masuk", "Penjualan", 870000, "Penjualan harian"},
		{21, "Keluar", "Kulakan", 580000, "Belanja produk lokal"},
	}
	for _, row := range rows {
		if _, err := tx.Exec(
			`INSERT INTO transactions (shop_id, type, category, amount, description, date)
			 VALUES (1, ?, ?, ?, ?, ?)`,
			row.typ, row.cat, row.amount, row.desc, now.AddDate(0, 0, -row.daysAgo).Format("02 Jan 2006"),
		); err != nil {
			return fmt.Errorf("insert transaction: %w", err)
		}
	}
	return nil
}

func seedPurchases(tx *sql.Tx, ids map[string]int64, now time.Time) error {
	purchases := []struct {
		name string
		qty  float64
		days int
	}{
		{"Indomie Goreng", 24, 3},
		{"Minyak Goreng Bimoli", 12, 6},
		{"Sambal UMKM Depok", 10, 8},
		{"Beras", 0, 0},
	}
	for _, purchase := range purchases {
		if purchase.qty <= 0 || ids[purchase.name] == 0 {
			continue
		}
		if _, err := tx.Exec(
			"INSERT INTO purchases (shop_id, product_id, quantity, purchase_date) VALUES (1, ?, ?, ?)",
			ids[purchase.name], purchase.qty, now.AddDate(0, 0, -purchase.days).Format("2006-01-02"),
		); err != nil {
			return fmt.Errorf("insert purchase: %w", err)
		}
	}
	return nil
}

func seedOrders(tx *sql.Tx) error {
	orders := []struct {
		id, item, status string
		qty              int
		total            float64
	}{
		{"DEMO-001", "Seblak Ceker", "Selesai", 2, 28000},
		{"DEMO-002", "Es Teh Manis", "Diproses", 5, 15000},
		{"DEMO-003", "Indomie Goreng", "Baru", 3, 36000},
		{"DEMO-004", "Sambal UMKM Depok", "Diproses", 2, 36000},
		{"DEMO-005", "Kerupuk", "Selesai", 10, 20000},
	}
	for _, order := range orders {
		if _, err := tx.Exec(
			"INSERT INTO orders (id, shop_id, item, qty, total_amount, status) VALUES (?, 1, ?, ?, ?, ?)",
			order.id, order.item, order.qty, order.total, order.status,
		); err != nil {
			return fmt.Errorf("insert order: %w", err)
		}
	}
	return nil
}

func fatal(err error) {
	_, _ = fmt.Fprintln(os.Stderr, err)
	os.Exit(1)
}
