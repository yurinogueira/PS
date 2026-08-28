package handlers

import (
	"encoding/json"
	"net/http"
	"ps/internal/application/usecase/client"
	domain "ps/internal/domain/client"
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
// @Failure      400    {string}  string "Requisição inválida"
// @Failure      401    {string}  string "Não autenticado"
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
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(req)
}

// List godoc
// @Summary      Listar clientes da temporada
// @Description  Retorna a lista de clientes da temporada do tenant autenticado
// @Tags         Clients
// @Produce      json
// @Success      200  {array}   client.SeasonClient
// @Failure      401  {string}  string "Não autenticado"
// @Failure      500  {string}  string "Erro interno"
// @Router       /api/v1/clients [get]
func (h *SeasonClientHandler) List(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	list, err := h.service.List(r.Context(), tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
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
// @Failure      400     {string}  string "Requisição inválida"
// @Failure      401     {string}  string "Não autenticado"
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
		http.Error(w, err.Error(), http.StatusInternalServerError)
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
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
