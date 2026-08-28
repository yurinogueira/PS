package handlers

import (
	"encoding/json"
	"net/http"
	"ps/internal/application/usecase/person"
	domain "ps/internal/domain/person"
	"ps/internal/shared/middleware"
)

type PersonHandler struct {
	service *person.Service
}

func NewPersonHandler(service *person.Service) *PersonHandler {
	return &PersonHandler{service: service}
}

// Create godoc
// @Summary      Criar pessoa
// @Description  Cadastra uma nova pessoa (cadastro único) para o tenant autenticado
// @Tags         People
// @Accept       json
// @Produce      json
// @Param        person body person.Person true "Dados da Pessoa"
// @Success      201    {object}  person.Person
// @Failure      400    {string}  string "Requisição inválida"
// @Failure      401    {string}  string "Não autenticado"
// @Failure      500    {string}  string "Erro interno"
// @Router       /api/v1/people [post]
func (h *PersonHandler) Create(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	var req domain.Person
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
// @Summary      Listar pessoas
// @Description  Retorna a lista de pessoas do tenant autenticado
// @Tags         People
// @Produce      json
// @Success      200  {array}   person.Person
// @Failure      401  {string}  string "Não autenticado"
// @Failure      500  {string}  string "Erro interno"
// @Router       /api/v1/people [get]
func (h *PersonHandler) List(w http.ResponseWriter, r *http.Request) {
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
// @Summary      Obter pessoa por ID
// @Description  Retorna os detalhes de uma pessoa específica pelo ID
// @Tags         People
// @Produce      json
// @Param        id   path      string  true  "ID da Pessoa"
// @Success      200  {object}  person.Person
// @Failure      400  {string}  string "ID obrigatório"
// @Failure      401  {string}  string "Não autenticado"
// @Failure      404  {string}  string "Pessoa não encontrada"
// @Failure      500  {string}  string "Erro interno"
// @Router       /api/v1/people/{id} [get]
func (h *PersonHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "id is required", http.StatusBadRequest)
		return
	}

	person, err := h.service.GetByID(r.Context(), id, tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(person)
}

// Update godoc
// @Summary      Atualizar pessoa
// @Description  Atualiza os dados de uma pessoa existente
// @Tags         People
// @Accept       json
// @Produce      json
// @Param        id      path      string         true  "ID da Pessoa"
// @Param        person  body      person.Person  true  "Dados da Pessoa"
// @Success      200     {object}  person.Person
// @Failure      400     {string}  string "Requisição inválida"
// @Failure      401     {string}  string "Não autenticado"
// @Failure      500     {string}  string "Erro interno"
// @Router       /api/v1/people/{id} [put]
func (h *PersonHandler) Update(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "id is required", http.StatusBadRequest)
		return
	}

	var req domain.Person
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
// @Summary      Excluir pessoa
// @Description  Remove uma pessoa do tenant autenticado
// @Tags         People
// @Param        id   path      string  true  "ID da Pessoa"
// @Success      204  {string}  string "Excluído com sucesso"
// @Failure      400  {string}  string "ID obrigatório"
// @Failure      401  {string}  string "Não autenticado"
// @Failure      500  {string}  string "Erro interno"
// @Router       /api/v1/people/{id} [delete]
func (h *PersonHandler) Delete(w http.ResponseWriter, r *http.Request) {
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
