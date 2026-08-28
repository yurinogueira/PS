package handlers

import (
	"encoding/json"
	"net/http"
	"ps/internal/application/usecase/photographer"
	domain "ps/internal/domain/photographer"
	"ps/internal/shared/middleware"
)

type PhotographerHandler struct {
	service *photographer.Service
}

func NewPhotographerHandler(service *photographer.Service) *PhotographerHandler {
	return &PhotographerHandler{service: service}
}

func (h *PhotographerHandler) Create(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	var req domain.Photographer
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.service.Create(r.Context(), &req, tenantID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(req)
}

func (h *PhotographerHandler) List(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	list, err := h.service.List(r.Context(), tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}
