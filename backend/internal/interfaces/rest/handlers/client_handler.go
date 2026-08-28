package handlers

import (
	"encoding/json"
	"net/http"
	"ps/internal/application/usecase/client"
	domain "ps/internal/domain/client"
)

type SeasonClientHandler struct {
	service *client.Service
}

func NewSeasonClientHandler(service *client.Service) *SeasonClientHandler {
	return &SeasonClientHandler{service: service}
}

func (h *SeasonClientHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req domain.SeasonClient
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

func (h *SeasonClientHandler) List(w http.ResponseWriter, r *http.Request) {
	list, err := h.service.List(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}
