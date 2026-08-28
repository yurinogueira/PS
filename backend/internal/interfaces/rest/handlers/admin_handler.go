package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	adminusecase "ps/internal/application/usecase/admin"
	tenantusecase "ps/internal/application/usecase/tenant"
	"ps/internal/shared/httpx"
)

type AdminHandler struct {
	tenantService *tenantusecase.Service
	adminService  *adminusecase.Service
}

func NewAdminHandler(tenantService *tenantusecase.Service, adminService *adminusecase.Service) *AdminHandler {
	return &AdminHandler{
		tenantService: tenantService,
		adminService:  adminService,
	}
}

type CreateTenantRequest struct {
	Name string `json:"name" example:"acme-corp"`
}

type AssignTenantRequest struct {
	TenantID string `json:"tenantId" example:"acme-corp"`
}

// ListTenants godoc
// @Summary      Listar todos os tenants
// @Description  Retorna a lista de todas as organizações (tenants) cadastradas no sistema
// @Tags         Admin
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} httpx.SuccessEnvelope
// @Failure      401 {object} httpx.ErrorEnvelope
// @Failure      403 {object} httpx.ErrorEnvelope
// @Router       /api/v1/admin/tenants [get]
func (h *AdminHandler) ListTenants(w http.ResponseWriter, r *http.Request) {
	tenants, err := h.tenantService.List(r.Context())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "Failed to list tenants", nil)
		return
	}
	httpx.Success(w, map[string]any{
		"tenants": tenants,
	})
}

// CreateTenant godoc
// @Summary      Criar novo tenant
// @Description  Cria uma nova organização (tenant) imutável no sistema
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Param        payload body CreateTenantRequest true "Dados do tenant"
// @Security     BearerAuth
// @Success      201 {object} httpx.SuccessEnvelope
// @Failure      400 {object} httpx.ErrorEnvelope
// @Failure      401 {object} httpx.ErrorEnvelope
// @Failure      403 {object} httpx.ErrorEnvelope
// @Failure      409 {object} httpx.ErrorEnvelope
// @Router       /api/v1/admin/tenants [post]
func (h *AdminHandler) CreateTenant(w http.ResponseWriter, r *http.Request) {
	var input CreateTenantRequest
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "Invalid request payload", nil)
		return
	}

	created, err := h.tenantService.Create(r.Context(), input.Name)
	if err != nil {
		switch {
		case errors.Is(err, tenantusecase.ErrInvalidName):
			httpx.Error(w, http.StatusBadRequest, "Invalid tenant name. Only alphanumeric characters, dashes and underscores are allowed (max 128 chars).", nil)
		case errors.Is(err, tenantusecase.ErrAlreadyExists):
			httpx.Error(w, http.StatusConflict, "Tenant already exists", nil)
		default:
			httpx.Error(w, http.StatusInternalServerError, "Failed to create tenant", nil)
		}
		return
	}

	httpx.Created(w, map[string]any{
		"tenant": created,
	})
}

// ListUsers godoc
// @Summary      Listar usuários para administração
// @Description  Retorna a lista de todos os usuários cadastrados e seus respectivos tenants e status
// @Tags         Admin
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} httpx.SuccessEnvelope
// @Failure      401 {object} httpx.ErrorEnvelope
// @Failure      403 {object} httpx.ErrorEnvelope
// @Router       /api/v1/admin/users [get]
func (h *AdminHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.adminService.ListUsers(r.Context())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "Failed to list users", nil)
		return
	}
	httpx.Success(w, map[string]any{
		"users": users,
	})
}

// AssignTenant godoc
// @Summary      Atribuir tenant a um usuário
// @Description  Vincula ou desvincula um usuário de uma organização (tenant)
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Param        id path string true "ID do Usuário"
// @Param        payload body AssignTenantRequest true "Dados de atribuição de tenant"
// @Security     BearerAuth
// @Success      200 {object} httpx.SuccessEnvelope
// @Failure      400 {object} httpx.ErrorEnvelope
// @Failure      401 {object} httpx.ErrorEnvelope
// @Failure      403 {object} httpx.ErrorEnvelope
// @Failure      404 {object} httpx.ErrorEnvelope
// @Router       /api/v1/admin/users/{id}/tenant [put]
func (h *AdminHandler) AssignTenant(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.Error(w, http.StatusBadRequest, "User ID is required", nil)
		return
	}

	var input AssignTenantRequest
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "Invalid request payload", nil)
		return
	}

	updated, err := h.adminService.AssignTenant(r.Context(), id, input.TenantID)
	if err != nil {
		switch {
		case errors.Is(err, adminusecase.ErrUserNotFound):
			httpx.Error(w, http.StatusNotFound, "User not found", nil)
		case errors.Is(err, adminusecase.ErrTenantNotFound):
			httpx.Error(w, http.StatusNotFound, "Tenant not found", nil)
		case errors.Is(err, adminusecase.ErrInvalidInput):
			httpx.Error(w, http.StatusBadRequest, "Invalid input", nil)
		default:
			httpx.Error(w, http.StatusInternalServerError, "Failed to assign tenant", nil)
		}
		return
	}

	httpx.Success(w, map[string]any{
		"user": updated,
	})
}
