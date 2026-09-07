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
		allowed := "*"
		if os.Getenv("CORS_ORIGIN") != "" {
			allowed = os.Getenv("CORS_ORIGIN")
		}
		w.Header().Set("Access-Control-Allow-Origin", allowed)
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
	authHandler := &handlers.AuthHandler{DB: db}
	salesHandler := &handlers.SalesHandler{DB: db}
	notificationHandler := &handlers.NotificationHandler{DB: db}
	chatbotHandler := &handlers.ChatbotHandler{DB: db}
	forecastHandler := &handlers.ForecastHandler{DB: db, Model: handlers.LoadForecastModel(), Horizon: 7}
	settingsHandler := &handlers.SettingsHandler{DB: db}

	mux := http.NewServeMux()

	// Health check
	mux.HandleFunc("/api/v1/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok","app":"LARISIN Go Backend"}`))
	})

	// Auth endpoints (public)
	mux.HandleFunc("/api/v1/auth/register", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		authHandler.Register(w, r)
	})
	mux.HandleFunc("/api/v1/auth/login", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		authHandler.Login(w, r)
	})
	mux.HandleFunc("/api/v1/auth/me", handlers.AuthRequired(func(w http.ResponseWriter, r *http.Request) {
		authHandler.Me(w, r)
	}))

	// Finance endpoints
	mux.HandleFunc("/api/v1/finance/summary", handlers.AuthRequired(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		financeHandler.GetSummary(w, r)
	}))
	mux.HandleFunc("/api/v1/finance/components", handlers.AuthRequired(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		financeHandler.GetComponents(w, r)
	}))
	mux.HandleFunc("/api/v1/finance/transactions", handlers.AuthRequired(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			financeHandler.GetTransactions(w, r)
		case http.MethodPost:
			financeHandler.CreateTransaction(w, r)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	// Products endpoints
	mux.HandleFunc("/api/v1/products", handlers.AuthRequired(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			productHandler.GetProducts(w, r)
		case http.MethodPost:
			productHandler.CreateProduct(w, r)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	}))
	mux.HandleFunc("/api/v1/products/", handlers.AuthRequired(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/v1/products/") {
			if strings.Contains(r.URL.Path, "/sku/") {
				productHandler.GetBySKU(w, r)
				return
			}
			productHandler.HandleProductByID(w, r)
			return
		}
		http.NotFound(w, r)
	}))

	// Dashboard endpoints
	mux.HandleFunc("/api/v1/dashboard/metrics", handlers.AuthRequired(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		dashboardHandler.GetMetrics(w, r)
	}))
	mux.HandleFunc("/api/v1/dashboard/analytics", handlers.AuthRequired(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		dashboardHandler.GetAnalytics(w, r)
	}))

	// Sales & purchases endpoints
	mux.HandleFunc("/api/v1/sales", handlers.AuthRequired(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		salesHandler.CreateSales(w, r)
	}))
	mux.HandleFunc("/api/v1/purchases", handlers.AuthRequired(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		salesHandler.CreatePurchase(w, r)
	}))

	// Forecast endpoints
	mux.HandleFunc("/api/v1/forecast/restock", handlers.AuthRequired(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		forecastHandler.GetRestock(w, r)
	}))

	// Notifications endpoint
	mux.HandleFunc("/api/v1/notifications", handlers.AuthRequired(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		notificationHandler.GetNotifications(w, r)
	}))

	// Chatbot endpoint
	mux.HandleFunc("/api/v1/chatbot/message", handlers.AuthRequired(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		chatbotHandler.HandleMessage(w, r)
	}))

	// Settings endpoints
	mux.HandleFunc("/api/v1/auth/password", handlers.AuthRequired(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPut {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		settingsHandler.UpdatePassword(w, r)
	}))
	mux.HandleFunc("/api/v1/auth/profile", handlers.AuthRequired(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPut {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		settingsHandler.UpdateProfile(w, r)
	}))
	mux.HandleFunc("/api/v1/shops", handlers.AuthRequired(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPut {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		settingsHandler.UpdateShop(w, r)
	}))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("LARISIN Go Backend running on port :%s", port)
	if err := http.ListenAndServe(":"+port, corsMiddleware(mux)); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}