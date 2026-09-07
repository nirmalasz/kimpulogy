package database

import (
	"database/sql"
	"fmt"
	"log"
	"time"

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

	if err := migrate(db); err != nil {
		return nil, fmt.Errorf("failed to migrate schema: %w", err)
	}

	if err := seedInitialData(db); err != nil {
		log.Printf("Warning: failed to seed initial data: %v", err)
	}

	return db, nil
}

func createTables(db *sql.DB) error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS shops (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			address TEXT NOT NULL DEFAULT '',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			shop_id INTEGER NOT NULL DEFAULT 1,
			name TEXT NOT NULL,
			email TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			role TEXT NOT NULL DEFAULT 'owner',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (shop_id) REFERENCES shops(id)
		);`,
		`CREATE TABLE IF NOT EXISTS products (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			shop_id INTEGER NOT NULL DEFAULT 1,
			name TEXT NOT NULL,
			category TEXT NOT NULL,
			price REAL NOT NULL,
			cost REAL NOT NULL DEFAULT 0,
			stock INTEGER NOT NULL DEFAULT 0,
			sku TEXT,
			barcode TEXT,
			expiry_date TEXT,
			min_stock INTEGER NOT NULL DEFAULT 10,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (shop_id) REFERENCES shops(id)
		);`,
		`CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shop_id INTEGER NOT NULL DEFAULT 1,
            product_id INTEGER,
            buyer_name TEXT,
            quantity REAL NOT NULL,
            unit_price REAL NOT NULL,
            total_nominal REAL NOT NULL,
            sale_date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (shop_id) REFERENCES shops(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        );`,
		`CREATE TABLE IF NOT EXISTS purchases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shop_id INTEGER NOT NULL DEFAULT 1,
            product_id INTEGER,
            quantity REAL NOT NULL,
            purchase_date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (shop_id) REFERENCES shops(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        );`,
		`CREATE TABLE IF NOT EXISTS transactions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			shop_id INTEGER NOT NULL DEFAULT 1,
			type TEXT NOT NULL, -- 'Masuk' or 'Keluar'
			category TEXT NOT NULL,
			amount REAL NOT NULL,
			description TEXT NOT NULL,
			date TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (shop_id) REFERENCES shops(id)
		);`,
		`CREATE TABLE IF NOT EXISTS orders (
			id TEXT PRIMARY KEY,
			shop_id INTEGER NOT NULL DEFAULT 1,
			item TEXT NOT NULL,
			qty INTEGER NOT NULL,
			total_amount REAL NOT NULL,
			status TEXT NOT NULL, -- 'Baru', 'Diproses', 'Selesai'
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (shop_id) REFERENCES shops(id)
		);`,
	}

	for _, q := range queries {
		if _, err := db.Exec(q); err != nil {
			return err
		}
	}
	return nil
}

// migrate applies additive schema changes to databases created before the
// feature columns / tenant scoping existed. Each step is idempotent.
func migrate(db *sql.DB) error {
	steps := []struct {
		table  string
		column string
		ddl    string
	}{
		{"products", "shop_id", "ALTER TABLE products ADD COLUMN shop_id INTEGER NOT NULL DEFAULT 1"},
		{"products", "sku", "ALTER TABLE products ADD COLUMN sku TEXT"},
		{"products", "barcode", "ALTER TABLE products ADD COLUMN barcode TEXT"},
		{"products", "expiry_date", "ALTER TABLE products ADD COLUMN expiry_date TEXT"},
		{"products", "min_stock", "ALTER TABLE products ADD COLUMN min_stock INTEGER NOT NULL DEFAULT 10"},
		{"sales", "shop_id", "ALTER TABLE sales ADD COLUMN shop_id INTEGER NOT NULL DEFAULT 1"},
		{"purchases", "shop_id", "ALTER TABLE purchases ADD COLUMN shop_id INTEGER NOT NULL DEFAULT 1"},
		{"transactions", "shop_id", "ALTER TABLE transactions ADD COLUMN shop_id INTEGER NOT NULL DEFAULT 1"},
		{"orders", "shop_id", "ALTER TABLE orders ADD COLUMN shop_id INTEGER NOT NULL DEFAULT 1"},
	}

	for _, step := range steps {
		exists, err := columnExists(db, step.table, step.column)
		if err != nil {
			return err
		}
		if exists {
			continue
		}
		if _, err := db.Exec(step.ddl); err != nil {
			return fmt.Errorf("migrate %s.%s: %w", step.table, step.column, err)
		}
	}

	// users: migrate phone -> email for DBs created before email auth
	if err := migrateUserEmail(db); err != nil {
		return err
	}

	return nil
}

// migrateUserEmail converts a legacy `phone` identity column to `email`.
func migrateUserEmail(db *sql.DB) error {
	emailExists, err := columnExists(db, "users", "email")
	if err != nil {
		return err
	}

	if !emailExists {
		if _, err := db.Exec("ALTER TABLE users ADD COLUMN email TEXT"); err != nil {
			return err
		}
		// Backfill email from phone where present
		_, _ = db.Exec("UPDATE users SET email = phone WHERE email IS NULL OR email = ''")
		// Fallback unique email for any rows without a phone value
		_, _ = db.Exec("UPDATE users SET email = 'user' || id || '@larisin.id' WHERE email IS NULL OR email = ''")
		_, _ = db.Exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)")
		// SQLite >= 3.35 supports DROP COLUMN; ignore if unsupported
		_, _ = db.Exec("ALTER TABLE users DROP COLUMN phone")
	}

	// Avatar URL column (settings/profile)
	hasAvatar, err := columnExists(db, "users", "avatar_url")
	if err != nil {
		return err
	}
	if !hasAvatar {
		if _, err := db.Exec("ALTER TABLE users ADD COLUMN avatar_url TEXT"); err != nil {
			return err
		}
	}

	return nil
}

func columnExists(db *sql.DB, table, column string) (bool, error) {
	rows, err := db.Query("PRAGMA table_info(" + table + ")")
	if err != nil {
		return false, err
	}
	defer rows.Close()

	for rows.Next() {
		var cid int
		var name, ctype string
		var notnull, pk int
		var dflt sql.NullString
		if err := rows.Scan(&cid, &name, &ctype, &notnull, &dflt, &pk); err != nil {
			return false, err
		}
		if name == column {
			return true, nil
		}
	}
	return false, rows.Err()
}

func seedInitialData(db *sql.DB) error {
	// Seed default shop if empty
	var shopCount int
	if err := db.QueryRow("SELECT COUNT(*) FROM shops").Scan(&shopCount); err == nil && shopCount == 0 {
		_, _ = db.Exec("INSERT INTO shops (name, address) VALUES (?, ?)", "Warung Mama Zafran", "Jl. Contoh No. 1")
	}

	// Seed demo owner user if empty (email: "zafran@larisin.id", password: "larisin123", bcrypt hash)
	var userCount int
	if err := db.QueryRow("SELECT COUNT(*) FROM users").Scan(&userCount); err == nil && userCount == 0 {
		_, _ = db.Exec(
			"INSERT INTO users (shop_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
			1,
			"Zafran",
			"zafran@larisin.id",
			"$2a$10$DjdViWnI9nmn6PbaZOfupuTCXUY5pteRMWwY333gGiIF7xElBhZFK",
			"owner",
		)
	}

	// Seed products if empty
	var productCount int
	if err := db.QueryRow("SELECT COUNT(*) FROM products").Scan(&productCount); err == nil && productCount == 0 {
		initialProducts := []struct {
			Name     string
			Category string
			Price    float64
			Cost     float64
			Stock    int
			SKU      string
			MinStock int
		}{
			{"Seblak Ceker", "Makanan", 14000, 8000, 42, "SBK-CKR-01", 10},
			{"Indomie Goreng", "Makanan", 12000, 6000, 8, "IDM-GRG-01", 10},
			{"Es Teh Manis", "Minuman", 3000, 1000, 60, "TEH-MNS-01", 10},
			{"Kerupuk", "Camilan", 2000, 800, 120, "KRP-001-01", 10},
			{"Seblak Basah", "Makanan", 15000, 9000, 5, "SBK-BSH-01", 10},
			{"Minyak Goreng Bimoli", "Sembako", 35000, 31000, 3, "MGB-2477-14", 10},
			{"Sirup Marjan", "Minuman", 18000, 15000, 12, "SRP-MRJ-01", 5},
		}
		for _, p := range initialProducts {
			_, _ = db.Exec(
				"INSERT INTO products (shop_id, name, category, price, cost, stock, sku, min_stock) VALUES (1, ?, ?, ?, ?, ?, ?, ?)",
				p.Name, p.Category, p.Price, p.Cost, p.Stock, p.SKU, p.MinStock,
			)
		}
	}

	// Seed transactions if empty
	var txCount int
	if err := db.QueryRow("SELECT COUNT(*) FROM transactions").Scan(&txCount); err == nil && txCount == 0 {
		now := time.Now()
		days := func(n int) string { return now.AddDate(0, 0, -n).Format("02 Jan 2006") }
		initialTransactions := []struct {
			Date string
			Desc string
			Type string
			Cat  string
			Amt  float64
		}{
			{days(0), "Penjualan harian", "Masuk", "Penjualan", 380000},
			{days(0), "Beli stok seblak", "Keluar", "Kulakan", 120000},
			{days(1), "Penjualan harian", "Masuk", "Penjualan", 415000},
			{days(1), "Beli gas & kemasan", "Keluar", "Operasional", 85000},
			{days(2), "Penjualan harian", "Masuk", "Penjualan", 362000},
			{days(2), "Beli stok minuman", "Keluar", "Kulakan", 96000},
			{days(3), "Penjualan harian", "Masuk", "Penjualan", 490000},
			{days(3), "Bayar listrik warung", "Keluar", "Operasional", 150000},
		}
		for _, tx := range initialTransactions {
			_, _ = db.Exec(
				"INSERT INTO transactions (shop_id, type, category, amount, description, date) VALUES (1, ?, ?, ?, ?, ?)",
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
				"INSERT INTO orders (id, shop_id, item, qty, total_amount, status) VALUES (?, 1, ?, ?, ?, ?)",
				o.ID, o.Item, o.Qty, o.Total, o.Status,
			)
		}
	}

	// Seed daily sales history (so analytics + forecast baseline have realistic data)
	var salesCount int
	if err := db.QueryRow("SELECT COUNT(*) FROM sales").Scan(&salesCount); err == nil && salesCount == 0 {
		now := time.Now()
		type productInfo struct {
			ID    int64
			Price float64
			Base  float64 // baseline daily qty
		}
		products := map[string]productInfo{}
		rows, err := db.Query("SELECT id, name, price FROM products")
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var id int64
				var name string
				var price float64
				if err := rows.Scan(&id, &name, &price); err == nil {
					products[name] = productInfo{ID: id, Price: price}
				}
			}
		}

		// Base daily demand per product (approximate for a small warung)
		bases := map[string]float64{
			"Seblak Ceker":        5,
			"Indomie Goreng":      4,
			"Es Teh Manis":        9,
			"Kerupuk":             6,
			"Seblak Basah":        2,
			"Minyak Goreng Bimoli": 1,
			"Sirup Marjan":        1,
		}

		// 70 days of history with weekday lift + deterministic noise
		for day := 0; day < 70; day++ {
			date := now.AddDate(0, 0, -(day + 1)).Format("2006-01-02")
			weekday := int(now.AddDate(0, 0, -(day + 1)).Weekday())
			lift := 1.0
			if weekday == 6 { // Saturday
				lift = 1.5
			} else if weekday == 0 { // Sunday
				lift = 1.2
			}
			for name, p := range products {
				base, ok := bases[name]
				if !ok {
					base = 2
				}
				// deterministic pseudo-noise from name+day
				noise := float64((len(name)*7+day*3)%5) * 0.3
				qty := base*lift + noise
				// occasional no-sale day for realism (skip ~10% of days)
				if (len(name)+day)%11 == 0 {
					continue
				}
				_, _ = db.Exec(
					"INSERT INTO sales (shop_id, product_id, quantity, unit_price, total_nominal, sale_date) VALUES (1, ?, ?, ?, ?, ?)",
					p.ID, qty, p.Price, qty*p.Price, date,
				)
			}
		}
	}

	return nil
}