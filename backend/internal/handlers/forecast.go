package handlers

import (
	"database/sql"
	"encoding/json"
	"math"
	"net/http"
	"os"
	"strings"

	"kimpulogy/backend/internal/forecast"
	"kimpulogy/backend/internal/models"
)

type ForecastHandler struct {
	DB      *sql.DB
	Model   *forecast.Model
	Horizon int
}

func normalizeProductName(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	return s
}

// matchModelLabel finds the best in-model label for a product name using
// exact or substring matching (min length 3 to avoid false positives).
func matchModelLabel(name string, model *forecast.Model) (string, bool) {
	n := normalizeProductName(name)
	if _, ok := model.Products[n]; ok {
		return n, true
	}
	best := ""
	bestLen := 0
	for label := range model.Products {
		if len(label) < 3 {
			continue
		}
		if strings.Contains(n, label) && len(label) > bestLen {
			best = label
			bestLen = len(label)
		}
	}
	if best != "" {
		return best, true
	}
	return "", false
}

func (h *ForecastHandler) GetRestock(w http.ResponseWriter, r *http.Request) {
	shopID := shopIDFrom(r)
	horizon := h.Horizon
	if horizon <= 0 {
		horizon = 7
	}

	rows, err := h.DB.Query(
		"SELECT id, name, COALESCE(sku,''), stock, min_stock FROM products WHERE shop_id = ? ORDER BY name",
		shopID,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	recs := make([]models.RestockRecommendation, 0, 8)
	for rows.Next() {
		var rec models.RestockRecommendation
		if err := rows.Scan(&rec.ProductID, &rec.Name, &rec.SKU, &rec.CurrentStock, &rec.MinStock); err != nil {
			continue
		}

		label, ok := matchModelLabel(rec.Name, h.Model)
		if ok {
			pm := h.Model.Products[label]
			forecast7d, p90 := pm.Forecast7D(horizon)
			rec.AvgDaily = pm.AvgDaily
			rec.Forecast7D = forecast7d
			rec.P907D = p90
			rec.Confidence = pm.Confidence()
			rec.InModel = true
			rec.Recommended = int(math.Ceil(p90 - float64(rec.CurrentStock)))
			if rec.Recommended < 0 {
				rec.Recommended = 0
			}
			if pm.AvgDaily > 0 {
				rec.DaysToStockout = float64(rec.CurrentStock) / pm.AvgDaily
			}
		} else {
			rec.InModel = false
			rec.Confidence = "low"
			rec.Recommended = rec.MinStock - rec.CurrentStock
			if rec.Recommended < 0 {
				rec.Recommended = 0
			}
		}

		// urgency
		switch {
		case rec.CurrentStock <= 0:
			rec.Urgency = "habis"
		case rec.InModel && rec.DaysToStockout <= 3:
			rec.Urgency = "urgent"
		case rec.CurrentStock <= rec.MinStock:
			rec.Urgency = "urgent"
		case rec.InModel && rec.DaysToStockout <= float64(horizon):
			rec.Urgency = "soon"
		default:
			rec.Urgency = "ok"
		}

		recs = append(recs, rec)
	}

	// sort: habis > urgent > soon > ok, then recommended desc
	severity := map[string]int{"habis": 3, "urgent": 2, "soon": 1, "ok": 0}
	for i := 0; i < len(recs); i++ {
		for j := i + 1; j < len(recs); j++ {
			a, b := recs[i], recs[j]
			as, bs := severity[a.Urgency], severity[b.Urgency]
			if as < bs || (as == bs && a.Recommended < b.Recommended) {
				recs[i], recs[j] = recs[j], recs[i]
			}
		}
	}

	source := h.Model.Source
	if source == "" {
		source = "not_trained"
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(models.RestockResponse{
		Horizon:         horizon,
		ModelType:       h.Model.ModelType,
		Source:          source,
		TrainedAt:       h.Model.TrainedAt,
		Recommendations: recs,
	})
}

// LoadForecastModel loads the trained model from env FORECAST_MODEL_PATH
// (default internal/forecast/model.json), returning an empty model if absent.
func LoadForecastModel() *forecast.Model {
	path := os.Getenv("FORECAST_MODEL_PATH")
	if path == "" {
		path = "internal/forecast/model.json"
	}
	m, err := forecast.Load(path)
	if err != nil {
		return forecast.NewModel("", 7)
	}
	return m
}