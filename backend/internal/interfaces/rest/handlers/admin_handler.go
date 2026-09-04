package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	adminusecase "ps/internal/application/usecase/admin"
	tenantusecase "ps/internal/application/usecase/tenant"
	domaintenant "ps/internal/domain/tenant"
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
	Name                  string `json:"name" example:"acme-corp"`
	Plan                  string `json:"plan,omitempty" example:"free"`
	PaymentStatus         string `json:"paymentStatus,omitempty" example:"paid"`
	HideOverviewByDefault bool   `json:"hideOverviewByDefault,omitempty" example:"false"`
}

type UpdateTenantPlanRequest struct {
	Plan string `json:"plan" example:"standard"`
}

type UpdateTenantPaymentStatusRequest struct {
	PaymentStatus string `json:"paymentStatus" example:"paid"`
}

type UpdateTenantSettingsRequest struct {
	HideOverviewByDefault bool `json:"hideOverviewByDefault" example:"true"`
}

type AssignTenantRequest struct {
	TenantID string `json:"tenantId" example:"acme-corp"`
}

type UpdateUserRoleRequest struct {
	Role string `json:"role" example:"manager"`
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
// @Description  Cria uma nova organização (tenant) no sistema com plano e status inicial
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

	created, err := h.tenantService.Create(r.Context(), tenantusecase.CreateTenantInput{
		Name:                  input.Name,
		Plan:                  input.Plan,
		PaymentStatus:         input.PaymentStatus,
		HideOverviewByDefault: input.HideOverviewByDefault,
	})
	if err != nil {
		switch {
		case errors.Is(err, tenantusecase.ErrInvalidName):
			httpx.Error(w, http.StatusBadRequest, "Invalid tenant name. Only alphanumeric characters, dashes and underscores are allowed (max 128 chars).", nil)
		case errors.Is(err, tenantusecase.ErrInvalidPlan):
			httpx.Error(w, http.StatusBadRequest, "Invalid plan. Must be 'free' or 'standard'.", nil)
		case errors.Is(err, tenantusecase.ErrInvalidPaymentStatus):
			httpx.Error(w, http.StatusBadRequest, "Invalid payment status. Must be 'paid' or 'unpaid'.", nil)
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

// UpdateTenantPlan godoc
// @Summary      Atualizar plano da organização
// @Description  Atualiza o plano da organização (free ou standard) e renova 14 dias de teste se free
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Param        name path string true "Nome do Tenant"
// @Param        payload body UpdateTenantPlanRequest true "Novo plano"
// @Security     BearerAuth
// @Success      200 {object} httpx.SuccessEnvelope
// @Failure      400 {object} httpx.ErrorEnvelope
// @Failure      401 {object} httpx.ErrorEnvelope
// @Failure      403 {object} httpx.ErrorEnvelope
// @Failure      404 {object} httpx.ErrorEnvelope
// @Router       /api/v1/admin/tenants/{name}/plan [put]
func (h *AdminHandler) UpdateTenantPlan(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("name")
	if name == "" {
		httpx.Error(w, http.StatusBadRequest, "Tenant name is required", nil)
		return
	}

	var input UpdateTenantPlanRequest
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "Invalid request payload", nil)
		return
	}

	updated, err := h.tenantService.UpdatePlan(r.Context(), name, input.Plan)
	if err != nil {
		switch {
		case errors.Is(err, tenantusecase.ErrNotFound):
			httpx.Error(w, http.StatusNotFound, "Tenant not found", nil)
		case errors.Is(err, tenantusecase.ErrInvalidPlan), errors.Is(err, tenantusecase.ErrInvalidName):
			httpx.Error(w, http.StatusBadRequest, "Invalid plan. Must be 'free' or 'standard'.", nil)
		default:
			httpx.Error(w, http.StatusInternalServerError, "Failed to update tenant plan", nil)
		}
		return
	}

	httpx.Success(w, map[string]any{
		"tenant": updated,
	})
}

// UpdateTenantPaymentStatus godoc
// @Summary      Atualizar status de pagamento da organização
// @Description  Atualiza o status financeiro da organização (paid ou unpaid)
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Param        name path string true "Nome do Tenant"
// @Param        payload body UpdateTenantPaymentStatusRequest true "Novo status financeiro"
// @Security     BearerAuth
// @Success      200 {object} httpx.SuccessEnvelope
// @Failure      400 {object} httpx.ErrorEnvelope
// @Failure      401 {object} httpx.ErrorEnvelope
// @Failure      403 {object} httpx.ErrorEnvelope
// @Failure      404 {object} httpx.ErrorEnvelope
// @Router       /api/v1/admin/tenants/{name}/payment-status [put]
func (h *AdminHandler) UpdateTenantPaymentStatus(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("name")
	if name == "" {
		httpx.Error(w, http.StatusBadRequest, "Tenant name is required", nil)
		return
	}

	var input UpdateTenantPaymentStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "Invalid request payload", nil)
		return
	}

	updated, err := h.tenantService.UpdatePaymentStatus(r.Context(), name, input.PaymentStatus)
	if err != nil {
		switch {
		case errors.Is(err, tenantusecase.ErrNotFound):
			httpx.Error(w, http.StatusNotFound, "Tenant not found", nil)
		case errors.Is(err, tenantusecase.ErrInvalidPaymentStatus), errors.Is(err, tenantusecase.ErrInvalidName):
			httpx.Error(w, http.StatusBadRequest, "Invalid payment status. Must be 'paid' or 'unpaid'.", nil)
		default:
			httpx.Error(w, http.StatusInternalServerError, "Failed to update tenant payment status", nil)
		}
		return
	}

	httpx.Success(w, map[string]any{
		"tenant": updated,
	})
}

// UpdateTenantSettings godoc
// @Summary      Atualizar configurações da organização
// @Description  Atualiza preferências e flags de configuração do tenant
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Param        name path string true "Nome do Tenant"
// @Param        payload body UpdateTenantSettingsRequest true "Novas configurações do tenant"
// @Security     BearerAuth
// @Success      200 {object} httpx.SuccessEnvelope
// @Failure      400 {object} httpx.ErrorEnvelope
// @Failure      401 {object} httpx.ErrorEnvelope
// @Failure      403 {object} httpx.ErrorEnvelope
// @Failure      404 {object} httpx.ErrorEnvelope
// @Router       /api/v1/admin/tenants/{name}/settings [put]
func (h *AdminHandler) UpdateTenantSettings(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("name")
	if name == "" {
		httpx.Error(w, http.StatusBadRequest, "Tenant name is required", nil)
		return
	}

	var input UpdateTenantSettingsRequest
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "Invalid request payload", nil)
		return
	}

	updated, err := h.tenantService.UpdateSettings(r.Context(), name, domaintenant.TenantSettings{
		HideOverviewByDefault: input.HideOverviewByDefault,
	})
	if err != nil {
		switch {
		case errors.Is(err, tenantusecase.ErrNotFound):
			httpx.Error(w, http.StatusNotFound, "Tenant not found", nil)
		case errors.Is(err, tenantusecase.ErrInvalidName):
			httpx.Error(w, http.StatusBadRequest, "Invalid tenant name", nil)
		default:
			httpx.Error(w, http.StatusInternalServerError, "Failed to update tenant settings", nil)
		}
		return
	}

	httpx.Success(w, map[string]any{
		"tenant": updated,
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

// UpdateUserRole godoc
// @Summary      Atualizar função de um usuário
// @Description  Altera a função/papel de um usuário no sistema (admin, manager, user). Requer perfil Administrador e impede o lockout do último administrador ativo.
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Param        id path string true "ID do Usuário"
// @Param        payload body UpdateUserRoleRequest true "Dados da nova função"
// @Security     BearerAuth
// @Success      200 {object} httpx.SuccessEnvelope
// @Failure      400 {object} httpx.ErrorEnvelope
// @Failure      401 {object} httpx.ErrorEnvelope
// @Failure      403 {object} httpx.ErrorEnvelope
// @Failure      404 {object} httpx.ErrorEnvelope
// @Router       /api/v1/admin/users/{id}/role [put]
func (h *AdminHandler) UpdateUserRole(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.Error(w, http.StatusBadRequest, "User ID is required", nil)
		return
	}

	var input UpdateUserRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "Invalid request payload", nil)
		return
	}

	updated, err := h.adminService.UpdateUserRole(r.Context(), id, input.Role)
	if err != nil {
		switch {
		case errors.Is(err, adminusecase.ErrUserNotFound):
			httpx.Error(w, http.StatusNotFound, "User not found", nil)
		case errors.Is(err, adminusecase.ErrInvalidInput):
			httpx.Error(w, http.StatusBadRequest, "Invalid input", nil)
		case errors.Is(err, adminusecase.ErrInvalidRole):
			httpx.Error(w, http.StatusBadRequest, "Invalid role. Must be 'admin', 'manager', or 'user'", nil)
		case errors.Is(err, adminusecase.ErrLastAdminLockout):
			httpx.Error(w, http.StatusBadRequest, "Cannot demote the last active administrator", nil)
		default:
			httpx.Error(w, http.StatusInternalServerError, "Failed to update user role", nil)
		}
		return
	}

	httpx.Success(w, map[string]any{
		"user": updated,
	})
}
