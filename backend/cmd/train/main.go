// Command train builds the base restock-demand model from retail sales history.
//
// Usage:
//
//	go run ./cmd/train -csv "train/Penjualan Toko Sembako.csv" [-out internal/forecast/model.json]
//
// The same pipeline will later be retrained on the live `sales` table once it
// accumulates enough daily history (see internal/forecast).
package main

import (
	"encoding/csv"
	"flag"
	"fmt"
	"io"
	"os"
	"strings"
	"time"

	"kimpulogy/backend/internal/forecast"
)

func main() {
	csvPath := flag.String("csv", "train/Penjualan Toko Sembako.csv", "path to retail sales CSV")
	outPath := flag.String("out", "internal/forecast/model.json", "output model path")
	horizon := flag.Int("horizon", 7, "forecast horizon in days")
	flag.Parse()

	f, err := os.Open(*csvPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "open csv: %v\n", err)
		os.Exit(1)
	}
	defer f.Close()

	r := csv.NewReader(f)
	r.Comma = ';'
	r.FieldsPerRecord = -1

	header, err := r.Read()
	if err != nil {
		fmt.Fprintf(os.Stderr, "read header: %v\n", err)
		os.Exit(1)
	}
	_ = header

	// column indexes
	nameIdx, qtyIdx, dateIdx := -1, -1, -1
	for i, h := range header {
		switch strings.ToLower(strings.TrimSpace(h)) {
		case "nama barang":
			nameIdx = i
		case "kuantum":
			qtyIdx = i
		case "tanggal":
			dateIdx = i
		}
	}
	if nameIdx < 0 || qtyIdx < 0 || dateIdx < 0 {
		fmt.Fprintf(os.Stderr, "csv missing required columns (nama barang, kuantum, tanggal): %v\n", header)
		os.Exit(1)
	}

	// aggregate daily qty per product
	agg := map[string]map[string]float64{} // product -> date -> qty
	for {
		rec, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			continue
		}
		if len(rec) <= nameIdx || len(rec) <= qtyIdx || len(rec) <= dateIdx {
			continue
		}
		name := normalizeName(rec[nameIdx])
		if name == "" {
			continue
		}
		qty := parseFloat(rec[qtyIdx])
		date := parseDate(rec[dateIdx])
		if qty <= 0 || date == nil {
			continue
		}
		key := date.Format("2006-01-02")
		if agg[name] == nil {
			agg[name] = map[string]float64{}
		}
		agg[name][key] += qty
	}

	m := forecast.NewModel(*csvPath, *horizon)

	for name, days := range agg {
		points := make([]forecast.DailyPoint, 0, len(days))
		for dateKey, qty := range days {
			t, err := time.Parse("2006-01-02", dateKey)
			if err != nil {
				continue
			}
			points = append(points, forecast.DailyPoint{Date: t, Qty: qty})
		}
		m.Train(name, points)
	}

	if err := m.Save(*outPath); err != nil {
		fmt.Fprintf(os.Stderr, "save model: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("trained %d products from %s -> %s\n", len(m.Products), *csvPath, *outPath)
	for name, pm := range m.Products {
		f, p90 := pm.Forecast7D(m.Horizon)
		fmt.Printf("  %-20s avg=%.2f std=%.2f n=%d forecast7d=%.1f p90=%.1f conf=%s\n",
			name, pm.AvgDaily, pm.StdDaily, pm.SampleDays, f, p90, pm.Confidence())
	}
}

func normalizeName(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	repl := map[string]string{
		"migor":         "minyak goreng",
		"mie":           "mie instan",
		"beras ":        "beras",
	}
	for k, v := range repl {
		if s == k {
			s = v
		}
	}
	return s
}

func parseFloat(s string) float64 {
	s = strings.TrimSpace(s)
	s = strings.ReplaceAll(s, ".", "")
	s = strings.ReplaceAll(s, ",", ".")
	var out float64
	fmt.Sscanf(s, "%g", &out)
	return out
}

func parseDate(s string) *time.Time {
	s = strings.TrimSpace(s)
	for _, layout := range []string{"02/01/2006", "2006-01-02", "02-01-2006"} {
		if t, err := time.Parse(layout, s); err == nil {
			return &t
		}
	}
	return nil
}