package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"ps/internal/application/usecase/season"
	domain "ps/internal/domain/season"
	domaintenant "ps/internal/domain/tenant"
	"ps/internal/shared/middleware"
)

type SeasonHandler struct {
	service *season.Service
}

func NewSeasonHandler(service *season.Service) *SeasonHandler {
	return &SeasonHandler{service: service}
}

// Create godoc
// @Summary      Criar temporada
// @Description  Cadastra uma nova temporada para o tenant autenticado
// @Tags         Seasons
// @Accept       json
// @Produce      json
// @Param        season body season.Season true "Dados da Temporada"
// @Success      201  {object}  season.Season
// @Failure      400  {string}  string "Requisição inválida"
// @Failure      401  {string}  string "Não autenticado"
// @Failure      403  {string}  string "Tenant bloqueado ou limite excedido"
// @Failure      500  {string}  string "Erro interno"
// @Router       /api/v1/seasons [post]
func (h *SeasonHandler) Create(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	var req domain.Season
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
// @Summary      Listar temporadas
// @Description  Retorna a lista de temporadas do tenant autenticado
// @Tags         Seasons
// @Produce      json
// @Success      200  {array}   season.Season
// @Failure      401  {string}  string "Não autenticado"
// @Failure      500  {string}  string "Erro interno"
// @Router       /api/v1/seasons [get]
func (h *SeasonHandler) List(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	list, err := h.service.List(r.Context(), tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if list == nil {
		list = make([]*domain.Season, 0)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}

// GetByID godoc
// @Summary      Obter temporada por ID
// @Description  Retorna os detalhes de uma temporada específica pelo ID
// @Tags         Seasons
// @Produce      json
// @Param        id   path      string  true  "ID da Temporada"
// @Success      200  {object}  season.Season
// @Failure      400  {string}  string "ID obrigatório"
// @Failure      401  {string}  string "Não autenticado"
// @Failure      404  {string}  string "Temporada não encontrada"
// @Failure      500  {string}  string "Erro interno"
// @Router       /api/v1/seasons/{id} [get]
func (h *SeasonHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "id is required", http.StatusBadRequest)
		return
	}

	s, err := h.service.GetByID(r.Context(), id, tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(s)
}

// Update godoc
// @Summary      Atualizar temporada
// @Description  Atualiza os dados de uma temporada existente
// @Tags         Seasons
// @Accept       json
// @Produce      json
// @Param        id      path      string         true  "ID da Temporada"
// @Param        season  body      season.Season  true  "Dados da Temporada"
// @Success      200     {object}  season.Season
// @Failure      400     {string}  string "Requisição inválida"
// @Failure      401     {string}  string "Não autenticado"
// @Failure      403     {string}  string "Tenant bloqueado"
// @Failure      500     {string}  string "Erro interno"
// @Router       /api/v1/seasons/{id} [put]
func (h *SeasonHandler) Update(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "id is required", http.StatusBadRequest)
		return
	}

	var req domain.Season
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
// @Summary      Excluir temporada
// @Description  Remove uma temporada do tenant autenticado
// @Tags         Seasons
// @Param        id   path      string  true  "ID da Temporada"
// @Success      204  {string}  string "Excluído com sucesso"
// @Failure      400  {string}  string "ID obrigatório"
// @Failure      401  {string}  string "Não autenticado"
// @Failure      403  {string}  string "Tenant bloqueado"
// @Failure      500  {string}  string "Erro interno"
// @Router       /api/v1/seasons/{id} [delete]
func (h *SeasonHandler) Delete(w http.ResponseWriter, r *http.Request) {
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
