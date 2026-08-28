package handlers

import (
	"encoding/json"
	"net/http"
	"ps/internal/application/usecase/photographer"
	domain "ps/internal/domain/photographer"
)

type PhotographerHandler struct {
	service *photographer.Service
}

func NewPhotographerHandler(service *photographer.Service) *PhotographerHandler {
	return &PhotographerHandler{service: service}
}

func (h *PhotographerHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req domain.Photographer
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

func (h *PhotographerHandler) List(w http.ResponseWriter, r *http.Request) {
	list, err := h.service.List(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}
