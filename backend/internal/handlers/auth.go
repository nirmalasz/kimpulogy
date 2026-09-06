package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"kimpulogy/backend/internal/models"
)

type ctxKey int

const (
	shopIDKey ctxKey = iota
	userIDKey
	userNameKey
)

type AuthHandler struct {
	DB *sql.DB
}

func jwtSecret() []byte {
	if s := os.Getenv("JWT_SECRET"); s != "" {
		return []byte(s)
	}
	return []byte("larisin-dev-secret-change-me")
}

type authClaims struct {
	UserID int64  `json:"uid"`
	ShopID int64  `json:"sid"`
	Email  string `json:"email"`
	Name   string `json:"name"`
	jwt.RegisteredClaims
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	if req.Name == "" || req.Email == "" || len(req.Password) < 6 {
		writeError(w, http.StatusBadRequest, "name, email, and password (min 6 chars) are required")
		return
	}

	// Email must be unique
	var exists int
	if err := h.DB.QueryRow("SELECT COUNT(*) FROM users WHERE email = ?", req.Email).Scan(&exists); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if exists > 0 {
		writeError(w, http.StatusConflict, "email already registered")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to hash password")
		return
	}

	shopName := strings.TrimSpace(req.ShopName)
	if shopName == "" {
		shopName = "Warung " + req.Name
	}

	tx, err := h.DB.Begin()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer tx.Rollback()

	res, err := tx.Exec("INSERT INTO shops (name, address) VALUES (?, ?)", shopName, "")
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	shopID, _ := res.LastInsertId()

	res, err = tx.Exec(
		"INSERT INTO users (shop_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
		shopID, req.Name, req.Email, string(hash), "owner",
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	userID, _ := res.LastInsertId()

	if err := tx.Commit(); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	token, err := issueToken(userID, shopID, req.Email, req.Name)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to issue token")
		return
	}

	user := models.User{ID: userID, ShopID: shopID, Name: req.Name, Email: req.Email, Role: "owner", CreatedAt: time.Now()}
	shop := models.Shop{ID: shopID, Name: shopName, CreatedAt: time.Now()}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(models.AuthResponse{Token: token, User: user, Shop: shop})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}

	var id, shopID int64
	var name, email, hash string
	err := h.DB.QueryRow(
		"SELECT id, shop_id, name, email, password_hash FROM users WHERE email = ?",
		strings.ToLower(strings.TrimSpace(req.Email)),
	).Scan(&id, &shopID, &name, &email, &hash)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusUnauthorized, "invalid email or password")
		return
	} else if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)) != nil {
		writeError(w, http.StatusUnauthorized, "invalid email or password")
		return
	}

	token, err := issueToken(id, shopID, email, name)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to issue token")
		return
	}

	var shop models.Shop
	var createdAt string
	_ = h.DB.QueryRow("SELECT id, name, address, created_at FROM shops WHERE id = ?", shopID).
		Scan(&shop.ID, &shop.Name, &shop.Address, &createdAt)

	user := models.User{ID: id, ShopID: shopID, Name: name, Email: email, Role: "owner", CreatedAt: time.Now()}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(models.AuthResponse{Token: token, User: user, Shop: shop})
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID := userIDFrom(r)
	shopID := shopIDFrom(r)

	var id, sid int64
	var name, email string
	var shopName, address string
	_ = h.DB.QueryRow("SELECT id, shop_id, name, email FROM users WHERE id = ?", userID).
		Scan(&id, &sid, &name, &email)
	_ = h.DB.QueryRow("SELECT name, address FROM shops WHERE id = ?", shopID).
		Scan(&shopName, &address)

	user := models.User{ID: id, ShopID: sid, Name: name, Email: email, Role: "owner"}
	shop := models.Shop{ID: sid, Name: shopName, Address: address}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(models.AuthResponse{Token: "", User: user, Shop: shop})
}

func issueToken(userID, shopID int64, email, name string) (string, error) {
	claims := authClaims{
		UserID: userID,
		ShopID: shopID,
		Email:  email,
		Name:   name,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "larisin",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret())
}

// AuthRequired verifies the bearer token and injects shop/user into the context.
func AuthRequired(h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		auth := r.Header.Get("Authorization")
		if !strings.HasPrefix(auth, "Bearer ") {
			writeError(w, http.StatusUnauthorized, "missing or invalid authorization header")
			return
		}

		raw := strings.TrimPrefix(auth, "Bearer ")
		parsed, err := jwt.ParseWithClaims(raw, &authClaims{}, func(t *jwt.Token) (interface{}, error) {
			return jwtSecret(), nil
		})
		if err != nil || !parsed.Valid {
			writeError(w, http.StatusUnauthorized, "invalid or expired token")
			return
		}

		claims, ok := parsed.Claims.(*authClaims)
		if !ok || claims.ShopID == 0 {
			writeError(w, http.StatusUnauthorized, "invalid token claims")
			return
		}

		ctx := r.Context()
		ctx = contextWithShopID(ctx, claims.ShopID)
		ctx = contextWithUserID(ctx, claims.UserID)
		ctx = contextWithUserName(ctx, claims.Name)
		h(w, r.WithContext(ctx))
	}
}

func shopIDFrom(r *http.Request) int64 {
	v, _ := r.Context().Value(shopIDKey).(int64)
	return v
}

func userIDFrom(r *http.Request) int64 {
	v, _ := r.Context().Value(userIDKey).(int64)
	return v
}

func userNameFrom(r *http.Request) string {
	v, _ := r.Context().Value(userNameKey).(string)
	return v
}

func contextWithShopID(ctx context.Context, v int64) context.Context {
	return context.WithValue(ctx, shopIDKey, v)
}

func contextWithUserID(ctx context.Context, v int64) context.Context {
	return context.WithValue(ctx, userIDKey, v)
}

func contextWithUserName(ctx context.Context, v string) context.Context {
	return context.WithValue(ctx, userNameKey, v)
}

// writeError sends a consistent JSON error body.
func writeError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}