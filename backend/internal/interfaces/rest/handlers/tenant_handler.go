package handlers

import (
	"errors"
	"net/http"

	tenantusecase "ps/internal/application/usecase/tenant"
	"ps/internal/shared/httpx"
	"ps/internal/shared/middleware"
)

type TenantHandler struct {
	tenantService *tenantusecase.Service
}

func NewTenantHandler(tenantService *tenantusecase.Service) *TenantHandler {
	return &TenantHandler{
		tenantService: tenantService,
	}
}

// GetCurrentTenant godoc
// @Summary      Dados do tenant atual
// @Description  Retorna o status, plano, período de teste e limites da organização associada ao usuário autenticado
// @Tags         Tenant
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} httpx.SuccessEnvelope
// @Failure      401 {object} httpx.ErrorEnvelope
// @Failure      403 {object} httpx.ErrorEnvelope
// @Failure      404 {object} httpx.ErrorEnvelope
// @Router       /api/v1/tenant [get]
func (h *TenantHandler) GetCurrentTenant(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	if tenantID == "" {
		httpx.Error(w, http.StatusForbidden, "Tenant is required", nil)
		return
	}

	status, err := h.tenantService.GetTenantStatus(r.Context(), tenantID)
	if err != nil {
		if errors.Is(err, tenantusecase.ErrNotFound) {
			httpx.Error(w, http.StatusNotFound, "Tenant not found", nil)
			return
		}
		httpx.Error(w, http.StatusInternalServerError, "Failed to get tenant status", nil)
		return
	}

	httpx.Success(w, map[string]any{
		"tenant": status,
	})
}
