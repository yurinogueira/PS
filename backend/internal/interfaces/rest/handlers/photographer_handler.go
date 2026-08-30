package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"ps/internal/application/usecase/photographer"
	domain "ps/internal/domain/photographer"
	domaintenant "ps/internal/domain/tenant"
	"ps/internal/shared/middleware"
)

type PhotographerHandler struct {
	service *photographer.Service
}

func NewPhotographerHandler(service *photographer.Service) *PhotographerHandler {
	return &PhotographerHandler{service: service}
}

// Create godoc
// @Summary      Criar fotógrafo
// @Description  Cadastra um novo fotógrafo para o tenant autenticado
// @Tags         Photographers
// @Accept       json
// @Produce      json
// @Param        photographer body photographer.Photographer true "Dados do Fotógrafo"
// @Success      201  {object}  photographer.Photographer
// @Failure      400  {string}  string "Requisição inválida"
// @Failure      401  {string}  string "Não autenticado"
// @Failure      403  {string}  string "Tenant bloqueado ou expirado"
// @Failure      500  {string}  string "Erro interno"
// @Router       /api/v1/photographers [post]
func (h *PhotographerHandler) Create(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	var req domain.Photographer
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.service.Create(r.Context(), &req, tenantID); err != nil {
		if errors.Is(err, domaintenant.ErrLimitExceeded) || errors.Is(err, domaintenant.ErrPaymentUnpaid) || errors.Is(err, domaintenant.ErrTrialExpired) {
			http.Error(w, err.Error(), http.StatusForbidden)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(req)
}

// List godoc
// @Summary      Listar fotógrafos
// @Description  Retorna a lista de fotógrafos do tenant autenticado
// @Tags         Photographers
// @Produce      json
// @Success      200  {array}   photographer.Photographer
// @Failure      401  {string}  string "Não autenticado"
// @Failure      500  {string}  string "Erro interno"
// @Router       /api/v1/photographers [get]
func (h *PhotographerHandler) List(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	list, err := h.service.List(r.Context(), tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if list == nil {
		list = make([]*domain.Photographer, 0)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}

// GetByID godoc
// @Summary      Obter fotógrafo por ID
// @Description  Retorna os detalhes de um fotógrafo específico pelo ID
// @Tags         Photographers
// @Produce      json
// @Param        id   path      string  true  "ID do Fotógrafo"
// @Success      200  {object}  photographer.Photographer
// @Failure      400  {string}  string "ID obrigatório"
// @Failure      401  {string}  string "Não autenticado"
// @Failure      404  {string}  string "Fotógrafo não encontrado"
// @Failure      500  {string}  string "Erro interno"
// @Router       /api/v1/photographers/{id} [get]
func (h *PhotographerHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "id is required", http.StatusBadRequest)
		return
	}

	p, err := h.service.GetByID(r.Context(), id, tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(p)
}

// Update godoc
// @Summary      Atualizar fotógrafo
// @Description  Atualiza os dados de um fotógrafo existente
// @Tags         Photographers
// @Accept       json
// @Produce      json
// @Param        id           path      string                     true  "ID do Fotógrafo"
// @Param        photographer body      photographer.Photographer  true  "Dados do Fotógrafo"
// @Success      200          {object}  photographer.Photographer
// @Failure      400          {string}  string "Requisição inválida"
// @Failure      401          {string}  string "Não autenticado"
// @Failure      403          {string}  string "Tenant bloqueado ou expirado"
// @Failure      500          {string}  string "Erro interno"
// @Router       /api/v1/photographers/{id} [put]
func (h *PhotographerHandler) Update(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "id is required", http.StatusBadRequest)
		return
	}

	var req domain.Photographer
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	req.ID = id

	if err := h.service.Update(r.Context(), &req, tenantID); err != nil {
		if errors.Is(err, domaintenant.ErrLimitExceeded) || errors.Is(err, domaintenant.ErrPaymentUnpaid) || errors.Is(err, domaintenant.ErrTrialExpired) {
			http.Error(w, err.Error(), http.StatusForbidden)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(req)
}

// Delete godoc
// @Summary      Excluir fotógrafo
// @Description  Remove um fotógrafo do tenant autenticado
// @Tags         Photographers
// @Param        id   path      string  true  "ID do Fotógrafo"
// @Success      204  {string}  string "Excluído com sucesso"
// @Failure      400  {string}  string "ID obrigatório"
// @Failure      401  {string}  string "Não autenticado"
// @Failure      403  {string}  string "Tenant bloqueado ou expirado"
// @Failure      500  {string}  string "Erro interno"
// @Router       /api/v1/photographers/{id} [delete]
func (h *PhotographerHandler) Delete(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "id is required", http.StatusBadRequest)
		return
	}

	if err := h.service.Delete(r.Context(), id, tenantID); err != nil {
		if errors.Is(err, domaintenant.ErrLimitExceeded) || errors.Is(err, domaintenant.ErrPaymentUnpaid) || errors.Is(err, domaintenant.ErrTrialExpired) {
			http.Error(w, err.Error(), http.StatusForbidden)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
