package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"kimpulogy/backend/internal/ai"
)

type InsightsHandler struct {
	AI *ai.Service
}

func (h *InsightsHandler) Get(w http.ResponseWriter, r *http.Request) {
	if h.AI == nil || !h.AI.Enabled() {
		writeError(w, http.StatusServiceUnavailable, "AI insight service is not configured")
		return
	}
	insight, err := h.AI.GenerateInsight(r.Context(), shopIDFrom(r), userIDFrom(r))
	if err != nil {
		log.Printf("AI insight request failed: %v", err)
		writeError(w, http.StatusBadGateway, "AI insight unavailable")
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(insight)
}
