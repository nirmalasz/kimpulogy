// Package forecast implements the base restock-demand model.
//
// Model type: moving-average baseline with day-of-week weights and a p90
// safety-stock adjustment. Trained offline from retail sales history and
// loaded by the API.
//
// Future: once the live `sales` table accumulates ~3-6 months of daily data,
// this pipeline will be retrained on that source (same params schema) using a
// stronger model (ARIMA or Prophet) instead of the moving-average baseline.
package forecast

import (
	"encoding/json"
	"fmt"
	"math"
	"os"
	"sort"
	"time"
)

type ProductModel struct {
	Label      string             `json:"label"`
	AvgDaily   float64            `json:"avg_daily"`
	StdDaily   float64            `json:"std_daily"`
	DayWeights map[string]float64 `json:"day_weights,omitempty"`
	SampleDays int                `json:"sample_days"`
}

type Model struct {
	Source    string                  `json:"source"`
	ModelType string                  `json:"model_type"`
	TrainedAt string                  `json:"trained_at"`
	Horizon   int                     `json:"horizon"`
	Products  map[string]ProductModel `json:"products"`
}

// NewModel returns an empty model with metadata set.
func NewModel(source string, horizon int) *Model {
	return &Model{
		Source:    source,
		ModelType: "moving_average_baseline",
		TrainedAt: time.Now().UTC().Format(time.RFC3339),
		Horizon:   horizon,
		Products:  map[string]ProductModel{},
	}
}

// DailyPoint is one (date, qty) observation.
type DailyPoint struct {
	Date time.Time
	Qty  float64
}

// Train fits per-product parameters from a list of (date, qty) observations.
// label is the product name; points should cover the sales history.
func (m *Model) Train(label string, points []DailyPoint) {
	if len(points) < 3 {
		return
	}

	sort.Slice(points, func(i, j int) bool { return points[i].Date.Before(points[j].Date) })

	// Day-of-week relative weights from observed days
	dowSum := map[int]float64{}
	dowCount := map[int]int{}
	for _, p := range points {
		dow := int(p.Date.Weekday())
		dowSum[dow] += p.Qty
		dowCount[dow]++
	}

	// Weekly average (7-day moving average over the tail, capped at 7*window days)
	const window = 2
	n := len(points)
	start := n - window*7
	if start < 0 {
		start = 0
	}
	windowSum := 0.0
	for i := start; i < n; i++ {
		windowSum += points[i].Qty
	}
	avgDaily := windowSum / float64(n-start)

	// Standard deviation over the same window for p90 safety stock
	var variance float64
	for i := start; i < n; i++ {
		d := points[i].Qty - avgDaily
		variance += d * d
	}
	stdDaily := math.Sqrt(variance / float64(n-start))

	// Day weights relative to the weekly mean
	dayWeights := map[string]float64{}
	for dow, sum := range dowSum {
		cnt := dowCount[dow]
		if cnt == 0 {
			continue
		}
		mean := sum / float64(cnt)
		rel := mean / avgDaily
		if rel < 0.5 {
			rel = 0.5
		}
		if rel > 1.8 {
			rel = 1.8
		}
		dayWeights[time.Weekday(dow).String()] = rel
	}

	m.Products[label] = ProductModel{
		Label:      label,
		AvgDaily:   round2(avgDaily),
		StdDaily:   round2(stdDaily),
		DayWeights: dayWeights,
		SampleDays: len(points),
	}
}

// Forecast7D predicts demand over the next horizon days starting tomorrow.
// p90 returns the mean forecast plus 1.28 * std (safety stock).
func (pm ProductModel) Forecast7D(horizon int) (forecast float64, p90 float64) {
	today := time.Now()
	for i := 1; i <= horizon; i++ {
		dow := today.AddDate(0, 0, i).Weekday().String()
		w := 1.0
		if v, ok := pm.DayWeights[dow]; ok {
			w = v
		}
		forecast += pm.AvgDaily * w
	}
	p90 = forecast + 1.28*pm.StdDaily*float64(horizon)
	if p90 < forecast {
		p90 = forecast
	}
	return round2(forecast), round2(p90)
}

func (pm ProductModel) Confidence() string {
	if pm.SampleDays >= 21 {
		return "high"
	}
	if pm.SampleDays >= 14 {
		return "medium"
	}
	return "low"
}

// Load reads a serialized model from path. Missing file returns an empty model.
func Load(path string) (*Model, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return NewModel("", 7), nil
		}
		return nil, err
	}
	var m Model
	if err := json.Unmarshal(data, &m); err != nil {
		return nil, fmt.Errorf("forecast: parse %s: %w", path, err)
	}
	if m.Products == nil {
		m.Products = map[string]ProductModel{}
	}
	return &m, nil
}

func (m *Model) Save(path string) error {
	data, err := json.MarshalIndent(m, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0o644)
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}