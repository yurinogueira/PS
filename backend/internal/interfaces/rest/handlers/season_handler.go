package handlers

import (
	"encoding/json"
	"net/http"
	"ps/internal/application/usecase/season"
	domain "ps/internal/domain/season"
)

type SeasonHandler struct {
	service *season.Service
}

func NewSeasonHandler(service *season.Service) *SeasonHandler {
	return &SeasonHandler{service: service}
}

func (h *SeasonHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req domain.Season
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.service.Create(r.Context(), &req); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(req)
}

func (h *SeasonHandler) List(w http.ResponseWriter, r *http.Request) {
	list, err := h.service.List(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}
