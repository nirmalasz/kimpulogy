package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"kimpulogy/backend/internal/models"
)

type NotificationHandler struct {
	DB *sql.DB
}

func (h *NotificationHandler) GetNotifications(w http.ResponseWriter, r *http.Request) {
	shopID := shopIDFrom(r)
	notifs := []models.AppNotification{}
	count := 0

	// Low stock / expiring from products
	rows, err := h.DB.Query(
		`SELECT name, stock, min_stock, COALESCE(expiry_date,'') FROM products WHERE shop_id = ? ORDER BY name`,
		shopID,
	)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var name, expiry string
			var stock, minStock int
			if err := rows.Scan(&name, &stock, &minStock, &expiry); err != nil {
				continue
			}
			if stock == 0 {
				notifs = append(notifs, models.AppNotification{
					ID: "low-0-" + name, Type: "low_stock", Title: "Stok Habis",
					Body: name + " sudah habis. Segera restock.", Time: "sekarang",
				})
				count++
			} else if stock <= minStock {
				notifs = append(notifs, models.AppNotification{
					ID: "low-" + name, Type: "low_stock", Title: "Stok menipis",
					Body: fmt.Sprintf("%s tersisa %d pcs.", name, stock), Time: "sekarang",
				})
				count++
			}
			if expiry != "" {
				if expDate, err := time.Parse("2006-01-02", expiry); err == nil {
					if !expDate.Before(time.Now().Truncate(24*time.Hour)) && expDate.Before(time.Now().AddDate(0, 0, 7)) {
						notifs = append(notifs, models.AppNotification{
							ID: "exp-" + name, Type: "expiring", Title: "Stok akan kedaluwarsa",
							Body: name + " kedaluwarsa dalam 7 hari.", Time: "sekarang",
						})
						count++
					}
				}
			}
		}
	}

	// New / processing orders
	orderRows, err := h.DB.Query(
		"SELECT id, item, qty, status, created_at FROM orders WHERE shop_id = ? AND status IN ('Baru','Diproses') ORDER BY created_at DESC LIMIT 5",
		shopID,
	)
	if err == nil {
		defer orderRows.Close()
		for orderRows.Next() {
			var id, item, status, createdAt string
			var qty int
			if err := orderRows.Scan(&id, &item, &qty, &status, &createdAt); err != nil {
				continue
			}
			notifs = append(notifs, models.AppNotification{
				ID: "order-" + id, Type: "order", Title: "Pesanan " + status,
				Body: fmt.Sprintf("%s x%d (%s)", item, qty, id), Time: "baru",
			})
			count++
		}
	}

	// Today's transactions
	var txCount int
	_ = h.DB.QueryRow(
		"SELECT COUNT(*) FROM transactions WHERE shop_id = ? AND date = ?",
		shopID, time.Now().Format("02 Jan 2006"),
	).Scan(&txCount)
	if txCount > 0 {
		notifs = append(notifs, models.AppNotification{
			ID: "tx-today", Type: "transaction", Title: "Transaksi hari ini",
			Body: fmt.Sprintf("%d pencatatan transaksi terjadi hari ini.", txCount), Time: "hari ini",
		})
		count++
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(models.NotificationsResponse{
		Notifications: notifs,
		UnreadCount:   count,
	})
}