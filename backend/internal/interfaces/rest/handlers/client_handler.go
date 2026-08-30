package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"ps/internal/application/usecase/client"
	domain "ps/internal/domain/client"
	domaintenant "ps/internal/domain/tenant"
	"ps/internal/shared/middleware"
)

type SeasonClientHandler struct {
	service *client.Service
}

func NewSeasonClientHandler(service *client.Service) *SeasonClientHandler {
	return &SeasonClientHandler{service: service}
}

// Create godoc
// @Summary      Criar cliente da temporada
// @Description  Cadastra um cliente vinculado a uma temporada com cães e fotos para o tenant autenticado
// @Tags         Clients
// @Accept       json
// @Produce      json
// @Param        client body client.SeasonClient true "Dados do Cliente da Temporada"
// @Success      201    {object}  client.SeasonClient
// @Failure      400    {string}  string "Requisição inválida ou referência não pertencente ao tenant"
// @Failure      401    {string}  string "Não autenticado"
// @Failure      403    {string}  string "Tenant bloqueado ou expirado"
// @Failure      500    {string}  string "Erro interno"
// @Router       /api/v1/clients [post]
func (h *SeasonClientHandler) Create(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	var req domain.SeasonClient
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.service.Create(r.Context(), &req, tenantID); err != nil {
		switch {
		case errors.Is(err, domaintenant.ErrLimitExceeded),
			errors.Is(err, domaintenant.ErrPaymentUnpaid),
			errors.Is(err, domaintenant.ErrTrialExpired):
			http.Error(w, err.Error(), http.StatusForbidden)
		case errors.Is(err, client.ErrPersonNotFound),
			errors.Is(err, client.ErrSeasonNotFound),
			errors.Is(err, client.ErrPhotographerNotFound):
			http.Error(w, err.Error(), http.StatusBadRequest)
		default:
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(req)
}

// List godoc
// @Summary      Listar clientes da temporada
// @Description  Retorna a lista paginada de clientes da temporada do tenant autenticado com suporte a busca e filtros
// @Tags         Clients
// @Produce      json
// @Param        season_id  query     string  false  "ID da Temporada"
// @Param        search     query     string  false  "Termo de busca textual (pessoa, cão ou foto)"
// @Param        page       query     int     false  "Número da página (padrão 1)"
// @Param        limit      query     int     false  "Itens por página (padrão 10, máximo 100)"
// @Success      200        {object}  client.PaginatedClients
// @Failure      401        {string}  string "Não autenticado"
// @Failure      500        {string}  string "Erro interno"
// @Router       /api/v1/clients [get]
func (h *SeasonClientHandler) List(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	seasonID := r.URL.Query().Get("season_id")
	search := r.URL.Query().Get("search")
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

	filter := domain.ListFilter{
		SeasonID: seasonID,
		Search:   search,
		Page:     page,
		Limit:    limit,
	}

	result, err := h.service.List(r.Context(), tenantID, filter)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if result == nil {
		result = &domain.PaginatedClients{
			Data:  make([]*domain.SeasonClient, 0),
			Total: 0,
			Page:  filter.Page,
			Limit: filter.Limit,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// GetByID godoc
// @Summary      Obter cliente por ID
// @Description  Retorna os detalhes de um cliente da temporada pelo ID
// @Tags         Clients
// @Produce      json
// @Param        id   path      string  true  "ID do Cliente"
// @Success      200  {object}  client.SeasonClient
// @Failure      400  {string}  string "ID obrigatório"
// @Failure      401  {string}  string "Não autenticado"
// @Failure      404  {string}  string "Cliente não encontrado"
// @Failure      500  {string}  string "Erro interno"
// @Router       /api/v1/clients/{id} [get]
func (h *SeasonClientHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "id is required", http.StatusBadRequest)
		return
	}

	client, err := h.service.GetByID(r.Context(), id, tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(client)
}

// Update godoc
// @Summary      Atualizar cliente da temporada
// @Description  Atualiza os dados de um cliente da temporada, cães e fotos
// @Tags         Clients
// @Accept       json
// @Produce      json
// @Param        id      path      string              true  "ID do Cliente"
// @Param        client  body      client.SeasonClient true  "Dados do Cliente"
// @Success      200     {object}  client.SeasonClient
// @Failure      400     {string}  string "Requisição inválida ou referência não pertencente ao tenant"
// @Failure      401     {string}  string "Não autenticado"
// @Failure      403     {string}  string "Tenant bloqueado ou expirado"
// @Failure      404     {string}  string "Cliente não encontrado"
// @Failure      500     {string}  string "Erro interno"
// @Router       /api/v1/clients/{id} [put]
func (h *SeasonClientHandler) Update(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "id is required", http.StatusBadRequest)
		return
	}

	var req domain.SeasonClient
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	req.ID = id

	if err := h.service.Update(r.Context(), &req, tenantID); err != nil {
		switch {
		case errors.Is(err, domaintenant.ErrLimitExceeded),
			errors.Is(err, domaintenant.ErrPaymentUnpaid),
			errors.Is(err, domaintenant.ErrTrialExpired):
			http.Error(w, err.Error(), http.StatusForbidden)
		case errors.Is(err, client.ErrClientNotFound):
			http.Error(w, err.Error(), http.StatusNotFound)
		case errors.Is(err, client.ErrPersonNotFound),
			errors.Is(err, client.ErrSeasonNotFound),
			errors.Is(err, client.ErrPhotographerNotFound):
			http.Error(w, err.Error(), http.StatusBadRequest)
		default:
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(req)
}

// Delete godoc
// @Summary      Excluir cliente da temporada
// @Description  Remove um cliente da temporada do tenant autenticado
// @Tags         Clients
// @Param        id   path      string  true  "ID do Cliente"
// @Success      204  {string}  string "Excluído com sucesso"
// @Failure      400  {string}  string "ID obrigatório"
// @Failure      401  {string}  string "Não autenticado"
// @Failure      403  {string}  string "Tenant bloqueado ou expirado"
// @Failure      500  {string}  string "Erro interno"
// @Router       /api/v1/clients/{id} [delete]
func (h *SeasonClientHandler) Delete(w http.ResponseWriter, r *http.Request) {
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
