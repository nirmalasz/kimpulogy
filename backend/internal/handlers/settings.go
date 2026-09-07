package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"

	"golang.org/x/crypto/bcrypt"

	"kimpulogy/backend/internal/models"
)

type SettingsHandler struct {
	DB *sql.DB
}

func (h *SettingsHandler) UpdatePassword(w http.ResponseWriter, r *http.Request) {
	userID := userIDFrom(r)

	var req models.UpdatePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}
	if len(req.NewPassword) < 6 {
		writeError(w, http.StatusBadRequest, "password baru minimal 6 karakter")
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

	if _, err := h.DB.Exec("UPDATE users SET password_hash = ? WHERE id = ?", string(newHash), userID); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "updated"})
}

func (h *SettingsHandler) UpdateShop(w http.ResponseWriter, r *http.Request) {
	shopID := shopIDFrom(r)

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

	if _, err := h.DB.Exec("UPDATE shops SET name = ? WHERE id = ?", req.Name, shopID); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "updated"})
}

func (h *SettingsHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID := userIDFrom(r)

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

	// Email uniqueness (excluding self)
	var dup int
	if err := h.DB.QueryRow(
		"SELECT COUNT(*) FROM users WHERE email = ? AND id <> ?",
		req.Email, userID,
	).Scan(&dup); err == nil && dup > 0 {
		writeError(w, http.StatusConflict, "email sudah dipakai akun lain")
		return
	}

	if _, err := h.DB.Exec(
		"UPDATE users SET name = ?, email = ?, avatar_url = ? WHERE id = ?",
		req.Name, req.Email, req.AvatarURL, userID,
	); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "updated"})
}