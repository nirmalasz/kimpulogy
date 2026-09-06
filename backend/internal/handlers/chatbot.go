package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"kimpulogy/backend/internal/models"
)

type ChatbotHandler struct {
	DB *sql.DB
}

// HandleMessage answers with rule-based "Ari". Stateless for now; intent is
// matched on keywords and answered from live shop data.
func (h *ChatbotHandler) HandleMessage(w http.ResponseWriter, r *http.Request) {
	shopID := shopIDFrom(r)

	var req models.ChatbotRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}
	msg := strings.ToLower(strings.TrimSpace(req.Message))
	if msg == "" {
		writeError(w, http.StatusBadRequest, "message cannot be empty")
		return
	}

	var reply string
	switch {
	case containsAny(msg, "stok", "habis", "barang", "berap", "berapa"):
		reply = h.answerStock(shopID)
	case containsAny(msg, "omzet", "penjualan", "uang", "laba", "keuangan", "pemasukan"):
		reply = h.answerFinance(shopID)
	case containsAny(msg, "restock", "forecast", "rekomendasi", "beli", "tambah stok", "kebutuhan"):
		reply = h.answerRestock(shopID)
	case containsAny(msg, "pesanan", "order"):
		reply = h.answerOrders(shopID)
	case containsAny(msg, "halo", "hai", "assalamu", "pagi", "siang", "malam", "selamat"):
		reply = "Halo! Aku Ari, asisten LARISIN. Tanya soal stok, omzet, restock, atau pesanan warungmu ya."
	default:
		reply = "Aku belum bisa jawab itu. Coba tanya soal stok, omzet/penjualan, rekomendasi restock, atau pesanan."
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(models.ChatbotResponse{Reply: reply})
}

func (h *ChatbotHandler) answerStock(shopID int64) string {
	var low, total int
	_ = h.DB.QueryRow("SELECT COUNT(*) FROM products WHERE shop_id = ? AND stock <= min_stock", shopID).Scan(&low)
	_ = h.DB.QueryRow("SELECT COUNT(*) FROM products WHERE shop_id = ?", shopID).Scan(&total)

	rows, err := h.DB.Query(
		"SELECT name, stock FROM products WHERE shop_id = ? AND stock <= min_stock ORDER BY stock ASC LIMIT 3",
		shopID,
	)
	if err != nil {
		return "Ada kendala membaca data stok, coba lagi nanti."
	}
	defer rows.Close()

	var items []string
	for rows.Next() {
		var name string
		var stock int
		if err := rows.Scan(&name, &stock); err == nil {
			items = append(items, fmt.Sprintf("%s (%d pcs)", name, stock))
		}
	}

	if low == 0 {
		return fmt.Sprintf("Semua stok aman. Total %d produk terdaftar.", total)
	}
	return fmt.Sprintf("Ada %d produk yang stoknya menipis/habis: %s. Mau aku bantu cek rekomendasi restock?", low, strings.Join(items, ", "))
}

func (h *ChatbotHandler) answerFinance(shopID int64) string {
	var income, expense float64
	_ = h.DB.QueryRow("SELECT COALESCE(SUM(amount),0) FROM transactions WHERE shop_id = ? AND type = ?", shopID, models.TypeIncome).Scan(&income)
	_ = h.DB.QueryRow("SELECT COALESCE(SUM(amount),0) FROM transactions WHERE shop_id = ? AND type = ?", shopID, models.TypeExpense).Scan(&expense)
	return fmt.Sprintf("Ringkasan keuangan warungmu: pemasukan Rp %.0f, pengeluaran Rp %.0f, laba bersih Rp %.0f.",
		income, expense, income-expense)
}

func (h *ChatbotHandler) answerRestock(shopID int64) string {
	rows, err := h.DB.Query(
		"SELECT name, stock, min_stock FROM products WHERE shop_id = ? AND stock <= min_stock ORDER BY stock ASC LIMIT 3",
		shopID,
	)
	if err != nil {
		return "Kendala membaca data, coba lagi nanti."
	}
	defer rows.Close()

	var items []string
	for rows.Next() {
		var name string
		var stock, min int
		if err := rows.Scan(&name, &stock, &min); err == nil {
			rec := min - stock
			if rec < 0 {
				rec = 0
			}
			items = append(items, fmt.Sprintf("%s: tambah %d", name, rec))
		}
	}

	if len(items) == 0 {
		return "Rekomendasi restock: semua produk masih di atas batas stok aman. Sampai stok menipis, belum perlu belanja."
	}
	return "Rekomendasi restock sekarang: " + strings.Join(items, "; ") + ". Cek halaman Forecast untuk detail."
}

func (h *ChatbotHandler) answerOrders(shopID int64) string {
	var count int
	_ = h.DB.QueryRow("SELECT COUNT(*) FROM orders WHERE shop_id = ? AND status IN ('Baru','Diproses')", shopID).Scan(&count)
	if count == 0 {
		return "Tidak ada pesanan yang belum selesai. Semua orderan beres!"
	}
	return fmt.Sprintf("Ada %d pesanan yang masih Baru/Diproses.", count)
}

func containsAny(s string, subs ...string) bool {
	for _, sub := range subs {
		if strings.Contains(s, sub) {
			return true
		}
	}
	return false
}