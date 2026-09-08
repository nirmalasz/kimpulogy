package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"kimpulogy/backend/internal/models"
)

type NotificationHandler struct {
	DB *sql.DB
}

func (h *NotificationHandler) GetNotifications(w http.ResponseWriter, r *http.Request) {
	shopID := shopIDFrom(r)
	userID := userIDFrom(r)
	notifs := make([]models.AppNotification, 0)

	rows, err := h.DB.Query(
		`SELECT id, name, stock, min_stock, COALESCE(unit, 'pcs'), COALESCE(expiry_date,'')
		 FROM products WHERE shop_id = ? ORDER BY name`,
		shopID,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()
	now := time.Now().In(time.Local)
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	for rows.Next() {
		var id int64
		var name, unit, expiry string
		var stock, minStock float64
		if err := rows.Scan(&id, &name, &stock, &minStock, &unit, &expiry); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		unit = models.NormalizeProductUnit(unit)
		if stock == 0 {
			notifs = append(notifs, models.AppNotification{
				ID: fmt.Sprintf("product:%d:low_stock", id), Type: "low_stock", Title: "Stok Habis",
				Body: name + " sudah habis. Segera restock.", Time: "sekarang",
			})
		} else if stock <= minStock {
			notifs = append(notifs, models.AppNotification{
				ID: fmt.Sprintf("product:%d:low_stock", id), Type: "low_stock", Title: "Stok menipis",
				Body: fmt.Sprintf("%s tersisa %g %s.", name, stock, unit), Time: "sekarang",
			})
		}
		if expiry != "" {
			if expDate, err := time.ParseInLocation("2006-01-02", expiry, now.Location()); err == nil && !expDate.Before(today) && expDate.Before(today.AddDate(0, 0, 7)) {
				notifs = append(notifs, models.AppNotification{
					ID: fmt.Sprintf("product:%d:expiry:%s", id, expiry), Type: "expiring", Title: "Stok akan kedaluwarsa",
					Body: name + " kedaluwarsa dalam 7 hari.", Time: "sekarang",
				})
			}
		}
	}
	if err := rows.Err(); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	orderRows, err := h.DB.Query(
		"SELECT id, item, qty, status FROM orders WHERE shop_id = ? AND status IN ('Baru','Diproses') ORDER BY created_at DESC LIMIT 5",
		shopID,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer orderRows.Close()
	for orderRows.Next() {
		var id, item, status string
		var qty int
		if err := orderRows.Scan(&id, &item, &qty, &status); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		notifs = append(notifs, models.AppNotification{
			ID: "order:" + id + ":pending", Type: "order", Title: "Pesanan " + status,
			Body: fmt.Sprintf("%s x%d (%s)", item, qty, id), Time: "baru",
		})
	}
	if err := orderRows.Err(); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	todayKey := now.Format("02 Jan 2006")
	var txCount int
	if err := h.DB.QueryRow("SELECT COUNT(*) FROM transactions WHERE shop_id = ? AND date = ?", shopID, todayKey).Scan(&txCount); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if txCount > 0 {
		notifs = append(notifs, models.AppNotification{
			ID: "transactions:" + now.Format("2006-01-02"), Type: "transaction", Title: "Transaksi hari ini",
			Body: fmt.Sprintf("%d pencatatan transaksi terjadi hari ini.", txCount), Time: "hari ini",
		})
	}

	states, err := h.loadStates(shopID, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	visible := make([]models.AppNotification, 0, len(notifs))
	unread := 0
	for _, notif := range notifs {
		state := states[notif.ID]
		if state == "dismissed" {
			continue
		}
		notif.Read = state == "read"
		if !notif.Read {
			unread++
		}
		visible = append(visible, notif)
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(models.NotificationsResponse{Notifications: visible, UnreadCount: unread})
}

func (h *NotificationHandler) UpdateState(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 4 || parts[3] == "" {
		http.NotFound(w, r)
		return
	}
	notificationID := parts[3]
	var req models.UpdateNotificationRequest
	r.Body = http.MaxBytesReader(w, r.Body, 4<<10)
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.State != "read" && req.State != "dismissed" {
		writeError(w, http.StatusBadRequest, "state must be read or dismissed")
		return
	}
	now := time.Now().UTC()
	var readAt, dismissedAt any
	if req.State == "read" {
		readAt = now
	} else {
		dismissedAt = now
	}
	_, err := h.DB.Exec(
		`INSERT INTO notification_states (shop_id, user_id, notification_id, state, read_at, dismissed_at)
		 VALUES (?, ?, ?, ?, ?, ?)
		 ON CONFLICT(shop_id, user_id, notification_id) DO UPDATE SET
		 state = excluded.state, read_at = excluded.read_at,
		 dismissed_at = excluded.dismissed_at, updated_at = CURRENT_TIMESTAMP`,
		shopIDFrom(r), userIDFrom(r), notificationID, req.State, readAt, dismissedAt,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update notification")
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"status": req.State})
}

func (h *NotificationHandler) loadStates(shopID, userID int64) (map[string]string, error) {
	rows, err := h.DB.Query("SELECT notification_id, state FROM notification_states WHERE shop_id = ? AND user_id = ?", shopID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	states := make(map[string]string)
	for rows.Next() {
		var id, state string
		if err := rows.Scan(&id, &state); err != nil {
			return nil, err
		}
		states[id] = state
	}
	return states, rows.Err()
}
