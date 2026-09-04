package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	"kimpulogy/backend/internal/database"
	"kimpulogy/backend/internal/handlers"
)

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "larisin.db"
	}

	db, err := database.InitDB(dbPath)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	financeHandler := &handlers.FinanceHandler{DB: db}
	productHandler := &handlers.ProductHandler{DB: db}
	dashboardHandler := &handlers.DashboardHandler{DB: db}

	mux := http.NewServeMux()

	// Health check
	mux.HandleFunc("/api/v1/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok","app":"LARISIN Go Backend"}`))
	})

	// Finance endpoints
	mux.HandleFunc("/api/v1/finance/summary", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		financeHandler.GetSummary(w, r)
	})

	mux.HandleFunc("/api/v1/finance/transactions", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			financeHandler.GetTransactions(w, r)
		case http.MethodPost:
			financeHandler.CreateTransaction(w, r)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Products endpoints
	mux.HandleFunc("/api/v1/products", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			productHandler.GetProducts(w, r)
		case http.MethodPost:
			productHandler.CreateProduct(w, r)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/api/v1/products/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/v1/products/") {
			productHandler.HandleProductByID(w, r)
			return
		}
		http.NotFound(w, r)
	})

	// Dashboard metrics endpoint
	mux.HandleFunc("/api/v1/dashboard/metrics", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		dashboardHandler.GetMetrics(w, r)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("LARISIN Go Backend running on port :%s", port)
	if err := http.ListenAndServe(":"+port, corsMiddleware(mux)); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
