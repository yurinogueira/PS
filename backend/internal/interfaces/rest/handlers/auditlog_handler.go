package handlers

import (
	"net/http"
	"strconv"
	"time"

	auditport "ps/internal/application/ports/auditlog"
	auditusecase "ps/internal/application/usecase/auditlog"
	domainaudit "ps/internal/domain/auditlog"
	"ps/internal/shared/httpx"
	"ps/internal/shared/middleware"
)

type AuditLogHandler struct {
	service *auditusecase.Service
}

func NewAuditLogHandler(service *auditusecase.Service) *AuditLogHandler {
	return &AuditLogHandler{service: service}
}

// List godoc
// @Summary      Listar logs de auditoria
// @Description  Retorna o histórico paginado de logs de auditoria de mutações no sistema (disponível para Administrador e Gestor)
// @Tags         Admin
// @Produce      json
// @Param        page query int false "Número da página (padrão: 1)"
// @Param        limit query int false "Itens por página (padrão: 20, máx: 100)"
// @Param        entity_type query string false "Filtrar por tipo de entidade (user, tenant, season, photographer, person, client)"
// @Param        action query string false "Filtrar por ação (CREATE, UPDATE, DELETE, ROLE_CHANGE, ASSIGN_TENANT)"
// @Param        user_id query string false "Filtrar por ID do usuário executor"
// @Param        start_date query string false "Data inicial em formato RFC3339"
// @Param        end_date query string false "Data final em formato RFC3339"
// @Security     BearerAuth
// @Success      200 {object} httpx.SuccessEnvelope
// @Failure      401 {object} httpx.ErrorEnvelope
// @Failure      403 {object} httpx.ErrorEnvelope
// @Failure      500 {object} httpx.ErrorEnvelope
// @Router       /api/v1/admin/logs [get]
func (h *AuditLogHandler) List(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	isAdmin := middleware.IsAdmin(ctx)
	tenantID := ""

	if !isAdmin {
		// Managers are scoped strictly to their own tenant
		tenantID = middleware.GetTenantID(ctx)
		if tenantID == "" {
			httpx.Error(w, http.StatusForbidden, "Forbidden: manager must belong to a tenant", nil)
			return
		}
	} else {
		// Admin can optionally filter by tenant_id or tenantId
		tenantID = r.URL.Query().Get("tenant_id")
		if tenantID == "" {
			tenantID = r.URL.Query().Get("tenantId")
		}
	}

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

	entityType := r.URL.Query().Get("entity_type")
	if entityType == "" {
		entityType = r.URL.Query().Get("entityType")
	}

	action := r.URL.Query().Get("action")

	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		userID = r.URL.Query().Get("userId")
	}

	filter := auditport.Filter{
		TenantID:   tenantID,
		EntityType: domainaudit.EntityType(entityType),
		Action:     domainaudit.Action(action),
		UserID:     userID,
		Page:       page,
		Limit:      limit,
	}

	startStr := r.URL.Query().Get("start_date")
	if startStr == "" {
		startStr = r.URL.Query().Get("startDate")
	}
	if startStr != "" {
		if t, err := time.Parse(time.RFC3339, startStr); err == nil {
			filter.StartDate = &t
		}
	}

	endStr := r.URL.Query().Get("end_date")
	if endStr == "" {
		endStr = r.URL.Query().Get("endDate")
	}
	if endStr != "" {
		if t, err := time.Parse(time.RFC3339, endStr); err == nil {
			filter.EndDate = &t
		}
	}

	result, err := h.service.List(ctx, filter)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "Failed to list audit logs", nil)
		return
	}

	httpx.Success(w, result)
}
