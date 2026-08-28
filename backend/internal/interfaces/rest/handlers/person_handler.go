package handlers

import (
	"encoding/json"
	"net/http"
	"ps/internal/application/usecase/person"
	domain "ps/internal/domain/person"
)

type PersonHandler struct {
	service *person.Service
}

func NewPersonHandler(service *person.Service) *PersonHandler {
	return &PersonHandler{service: service}
}

func (h *PersonHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req domain.Person
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

func (h *PersonHandler) List(w http.ResponseWriter, r *http.Request) {
	list, err := h.service.List(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}
