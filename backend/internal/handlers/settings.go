package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"net/mail"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"

	"kimpulogy/backend/internal/models"
)

type SettingsHandler struct {
	DB *sql.DB
}

func (h *SettingsHandler) UpdatePassword(w http.ResponseWriter, r *http.Request) {
	userID := userIDFrom(r)

	r.Body = http.MaxBytesReader(w, r.Body, 16<<10)
	var req models.UpdatePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}
	if len(req.NewPassword) < 6 {
		writeError(w, http.StatusBadRequest, "password baru minimal 6 karakter")
		return
	}
	if req.OldPassword == req.NewPassword {
		writeError(w, http.StatusBadRequest, "password baru harus berbeda")
		return
	}

	var hash string
	err := h.DB.QueryRow("SELECT password_hash FROM users WHERE id = ?", userID).Scan(&hash)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusUnauthorized, "user not found")
		return
	} else if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.OldPassword)) != nil {
		writeError(w, http.StatusUnauthorized, "password lama tidak sesuai")
		return
	}

	newHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to hash password")
		return
	}

	res, err := h.DB.Exec("UPDATE users SET password_hash = ? WHERE id = ?", string(newHash), userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if affected, err := res.RowsAffected(); err != nil || affected != 1 {
		writeError(w, http.StatusUnauthorized, "user not found")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "updated"})
}

func (h *SettingsHandler) UpdateShop(w http.ResponseWriter, r *http.Request) {
	shopID := shopIDFrom(r)

	r.Body = http.MaxBytesReader(w, r.Body, 8<<10)
	var req models.UpdateShopRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "nama warung tidak boleh kosong")
		return
	}

	res, err := h.DB.Exec("UPDATE shops SET name = ? WHERE id = ?", req.Name, shopID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if affected, err := res.RowsAffected(); err != nil || affected != 1 {
		writeError(w, http.StatusNotFound, "shop not found")
		return
	}
	var shop models.Shop
	var shopCreatedAt string
	if err := h.DB.QueryRow("SELECT id, name, address, created_at FROM shops WHERE id = ?", shopID).Scan(&shop.ID, &shop.Name, &shop.Address, &shopCreatedAt); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	shop.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", shopCreatedAt)

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"status": "updated", "shop": shop})
}

func (h *SettingsHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID := userIDFrom(r)

	r.Body = http.MaxBytesReader(w, r.Body, 16<<10)
	var req models.UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.AvatarURL = strings.TrimSpace(req.AvatarURL)
	if req.Name == "" || req.Email == "" {
		writeError(w, http.StatusBadRequest, "nama dan email tidak boleh kosong")
		return
	}
	parsedEmail, err := mail.ParseAddress(req.Email)
	if err != nil || parsedEmail.Address != req.Email {
		writeError(w, http.StatusBadRequest, "format email tidak valid")
		return
	}

	// Email uniqueness (excluding self)
	var dup int
	if err := h.DB.QueryRow(
		"SELECT COUNT(*) FROM users WHERE email = ? AND id <> ?",
		req.Email, userID,
	).Scan(&dup); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to check email")
		return
	} else if dup > 0 {
		writeError(w, http.StatusConflict, "email sudah dipakai akun lain")
		return
	}

	res, err := h.DB.Exec(
		"UPDATE users SET name = ?, email = ?, avatar_url = ? WHERE id = ?",
		req.Name, req.Email, req.AvatarURL, userID,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if affected, err := res.RowsAffected(); err != nil || affected != 1 {
		writeError(w, http.StatusUnauthorized, "user not found")
		return
	}
	var user models.User
	var userCreatedAt string
	if err := h.DB.QueryRow("SELECT id, shop_id, name, email, role, avatar_url, created_at FROM users WHERE id = ?", userID).
		Scan(&user.ID, &user.ShopID, &user.Name, &user.Email, &user.Role, &user.AvatarURL, &userCreatedAt); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	user.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", userCreatedAt)

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"status": "updated", "user": user})
}
