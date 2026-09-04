package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	reportport "ps/internal/application/ports/report"
	userport "ps/internal/application/ports/user"
	reportusecase "ps/internal/application/usecase/report"
	reportdomain "ps/internal/domain/report"
	domaintenant "ps/internal/domain/tenant"
	"ps/internal/shared/httpx"
	"ps/internal/shared/middleware"
)

type ReportHandler struct {
	service  *reportusecase.Service
	userRepo userport.Repository
}

func NewReportHandler(service *reportusecase.Service, userRepo userport.Repository) *ReportHandler {
	return &ReportHandler{
		service:  service,
		userRepo: userRepo,
	}
}

func handleReportTenantError(w http.ResponseWriter, err error) bool {
	if errors.Is(err, domaintenant.ErrLimitExceeded) ||
		errors.Is(err, domaintenant.ErrPaymentUnpaid) ||
		errors.Is(err, domaintenant.ErrTrialExpired) {
		httpx.Error(w, http.StatusForbidden, err.Error(), nil)
		return true
	}
	return false
}

func (h *ReportHandler) getUserSummary(r *http.Request) (string, string, string) {
	userID := middleware.GetUserID(r.Context())
	var userEmail, userName string
	if userID != "" && h.userRepo != nil {
		user, err := h.userRepo.FindByID(r.Context(), userID)
		if err == nil && user.Email != "" {
			userEmail = user.Email
			userName = user.Name
		}
	}
	return userID, userEmail, userName
}

// ExportClientsCSV godoc
// @Summary      Exportar relatório CSV de clientes
// @Description  Inicia a extração assíncrona do relatório consolidado de clientes, cães, fotos e pagamentos do tenant autenticado e envia o link para o e-mail cadastrado
// @Tags         Reports
// @Param        season_id query string false "ID do evento para filtrar o relatório"
// @Produce      json
// @Success      202  {object}  httpx.SuccessEnvelope
// @Failure      401  {object}  httpx.ErrorEnvelope "Não autenticado"
// @Failure      403  {object}  httpx.ErrorEnvelope "Tenant não associado ou bloqueado"
// @Failure      500  {object}  httpx.ErrorEnvelope "Erro interno"
// @Router       /api/v1/reports/clients-csv [post]
func (h *ReportHandler) ExportClientsCSV(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	if tenantID == "" {
		httpx.Error(w, http.StatusForbidden, "Tenant is required", nil)
		return
	}

	seasonID := r.URL.Query().Get("season_id")
	userID, userEmail, userName := h.getUserSummary(r)

	job := &reportdomain.ReportJob{
		TenantID: tenantID,
		SeasonID: seasonID,
		Type:     reportdomain.TypeClientsCSV,
		RequestedBy: reportdomain.UserSummary{
			UserID:    userID,
			UserName:  userName,
			UserEmail: userEmail,
		},
		UserEmail: userEmail,
		UserName:  userName,
	}

	startedJob, err := h.service.StartJob(r.Context(), job)
	if err != nil {
		if handleReportTenantError(w, err) {
			return
		}
		httpx.Error(w, http.StatusInternalServerError, "Failed to start export job", nil)
		return
	}

	httpx.Accepted(w, map[string]any{
		"message": "Geração do relatório iniciada com sucesso. O arquivo CSV será enviado para o seu e-mail em instantes.",
		"job":     startedJob,
	})
}

// ExportUnpaidClientsCSV godoc
// @Summary      Exportar relatório CSV de clientes com pagamentos não pagos
// @Description  Inicia a extração assíncrona do relatório de clientes e fotos com pagamentos não quitados ou pendentes do tenant autenticado e envia o link para o e-mail cadastrado
// @Tags         Reports
// @Param        season_id query string false "ID do evento para filtrar o relatório"
// @Produce      json
// @Success      202  {object}  httpx.SuccessEnvelope
// @Failure      401  {object}  httpx.ErrorEnvelope "Não autenticado"
// @Failure      403  {object}  httpx.ErrorEnvelope "Tenant não associado ou bloqueado"
// @Failure      500  {object}  httpx.ErrorEnvelope "Erro interno"
// @Router       /api/v1/reports/unpaid-clients-csv [post]
func (h *ReportHandler) ExportUnpaidClientsCSV(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	if tenantID == "" {
		httpx.Error(w, http.StatusForbidden, "Tenant is required", nil)
		return
	}

	seasonID := r.URL.Query().Get("season_id")
	userID, userEmail, userName := h.getUserSummary(r)

	job := &reportdomain.ReportJob{
		TenantID: tenantID,
		SeasonID: seasonID,
		Type:     reportdomain.TypeUnpaidClientsCSV,
		RequestedBy: reportdomain.UserSummary{
			UserID:    userID,
			UserName:  userName,
			UserEmail: userEmail,
		},
		UserEmail: userEmail,
		UserName:  userName,
	}

	startedJob, err := h.service.StartJob(r.Context(), job)
	if err != nil {
		if handleReportTenantError(w, err) {
			return
		}
		httpx.Error(w, http.StatusInternalServerError, "Failed to start export job", nil)
		return
	}

	httpx.Accepted(w, map[string]any{
		"message": "Geração do relatório iniciada com sucesso. O arquivo CSV será enviado para o seu e-mail em instantes.",
		"job":     startedJob,
	})
}

// ExportPaidClientsCSV godoc
// @Summary      Exportar relatório CSV de clientes com pagamentos confirmados
// @Description  Inicia a extração assíncrona do relatório de clientes e fotos com pagamentos confirmados (pagos) do tenant autenticado e envia o link para o e-mail cadastrado
// @Tags         Reports
// @Param        season_id query string false "ID do evento para filtrar o relatório"
// @Produce      json
// @Success      202  {object}  httpx.SuccessEnvelope
// @Failure      401  {object}  httpx.ErrorEnvelope "Não autenticado"
// @Failure      403  {object}  httpx.ErrorEnvelope "Tenant não associado ou bloqueado"
// @Failure      500  {object}  httpx.ErrorEnvelope "Erro interno"
// @Router       /api/v1/reports/paid-clients-csv [post]
func (h *ReportHandler) ExportPaidClientsCSV(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	if tenantID == "" {
		httpx.Error(w, http.StatusForbidden, "Tenant is required", nil)
		return
	}

	seasonID := r.URL.Query().Get("season_id")
	userID, userEmail, userName := h.getUserSummary(r)

	job := &reportdomain.ReportJob{
		TenantID: tenantID,
		SeasonID: seasonID,
		Type:     reportdomain.TypePaidClientsCSV,
		RequestedBy: reportdomain.UserSummary{
			UserID:    userID,
			UserName:  userName,
			UserEmail: userEmail,
		},
		UserEmail: userEmail,
		UserName:  userName,
	}

	startedJob, err := h.service.StartJob(r.Context(), job)
	if err != nil {
		if handleReportTenantError(w, err) {
			return
		}
		httpx.Error(w, http.StatusInternalServerError, "Failed to start export job", nil)
		return
	}

	httpx.Accepted(w, map[string]any{
		"message": "Geração do relatório iniciada com sucesso. O arquivo CSV será enviado para o seu e-mail em instantes.",
		"job":     startedJob,
	})
}

// ExportClientsPDF godoc
// @Summary      Exportar relatório PDF de clientes
// @Description  Inicia a extração assíncrona do relatório consolidado em PDF de clientes, cães e fotos para o tenant autenticado e envia o link para o e-mail cadastrado
// @Tags         Reports
// @Param        season_id query string false "ID do evento para filtrar o relatório"
// @Produce      json
// @Success      202  {object}  httpx.SuccessEnvelope
// @Failure      401  {object}  httpx.ErrorEnvelope "Não autenticado"
// @Failure      403  {object}  httpx.ErrorEnvelope "Tenant não associado ou bloqueado"
// @Failure      500  {object}  httpx.ErrorEnvelope "Erro interno"
// @Router       /api/v1/reports/clients-pdf [post]
func (h *ReportHandler) ExportClientsPDF(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	if tenantID == "" {
		httpx.Error(w, http.StatusForbidden, "Tenant is required", nil)
		return
	}

	seasonID := r.URL.Query().Get("season_id")
	userID, userEmail, userName := h.getUserSummary(r)

	job := &reportdomain.ReportJob{
		TenantID: tenantID,
		SeasonID: seasonID,
		Type:     reportdomain.TypeClientsPDF,
		RequestedBy: reportdomain.UserSummary{
			UserID:    userID,
			UserName:  userName,
			UserEmail: userEmail,
		},
		UserEmail: userEmail,
		UserName:  userName,
	}

	startedJob, err := h.service.StartJob(r.Context(), job)
	if err != nil {
		if handleReportTenantError(w, err) {
			return
		}
		httpx.Error(w, http.StatusInternalServerError, "Failed to start export job", nil)
		return
	}

	httpx.Accepted(w, map[string]any{
		"message": "Geração do relatório em PDF iniciada com sucesso. O arquivo será enviado para o seu e-mail em instantes.",
		"job":     startedJob,
	})
}

type ExportDynamicPaymentRequest struct {
	SeasonID       string   `json:"season_id"`
	PaidStatus     string   `json:"paid_status"` // "all", "paid", "unpaid"
	IsPaid         *bool    `json:"is_paid"`
	PaymentMethods []string `json:"payment_methods"`
}

// ExportDynamicPayment godoc
// @Summary      Exportar relatório dinâmico filtrado por status e métodos de pagamento
// @Description  Inicia a extração assíncrona do relatório customizado por status de pagamento e métodos múltiplos para o tenant autenticado
// @Tags         Reports
// @Accept       json
// @Produce      json
// @Param        body body ExportDynamicPaymentRequest true "Parâmetros da exportação dinâmica"
// @Success      202  {object}  httpx.SuccessEnvelope
// @Failure      400  {object}  httpx.ErrorEnvelope "Requisição inválida"
// @Failure      401  {object}  httpx.ErrorEnvelope "Não autenticado"
// @Failure      403  {object}  httpx.ErrorEnvelope "Tenant não associado ou bloqueado"
// @Failure      500  {object}  httpx.ErrorEnvelope "Erro interno"
// @Router       /api/v1/reports/dynamic-payment [post]
func (h *ReportHandler) ExportDynamicPayment(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	if tenantID == "" {
		httpx.Error(w, http.StatusForbidden, "Tenant is required", nil)
		return
	}

	var req ExportDynamicPaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "Corpo da requisição inválido", nil)
		return
	}

	seasonID := req.SeasonID
	if seasonID == "" {
		seasonID = r.URL.Query().Get("season_id")
	}

	var isPaid *bool
	if req.IsPaid != nil {
		isPaid = req.IsPaid
	} else if req.PaidStatus != "" {
		switch strings.ToLower(req.PaidStatus) {
		case "paid", "pago", "sim", "yes":
			val := true
			isPaid = &val
		case "unpaid", "nao_pago", "não pago", "nao", "não", "no":
			val := false
			isPaid = &val
		case "all", "todos":
			isPaid = nil
		}
	}

	filters := &reportdomain.ReportFilters{
		IsPaid:         isPaid,
		PaymentMethods: req.PaymentMethods,
	}

	userID, userEmail, userName := h.getUserSummary(r)

	job := &reportdomain.ReportJob{
		TenantID: tenantID,
		SeasonID: seasonID,
		Type:     reportdomain.TypeDynamicPayment,
		Filters:  filters,
		RequestedBy: reportdomain.UserSummary{
			UserID:    userID,
			UserName:  userName,
			UserEmail: userEmail,
		},
		UserEmail: userEmail,
		UserName:  userName,
	}

	startedJob, err := h.service.StartJob(r.Context(), job)
	if err != nil {
		if handleReportTenantError(w, err) {
			return
		}
		httpx.Error(w, http.StatusInternalServerError, "Failed to start dynamic report job", nil)
		return
	}

	httpx.Accepted(w, map[string]any{
		"message": "Geração do relatório dinâmico iniciada com sucesso. O arquivo CSV será enviado para o seu e-mail em instantes.",
		"job":     startedJob,
	})
}

// ListHistory godoc
// @Summary      Listar histórico de exportações
// @Description  Retorna o histórico paginado de jobs de relatórios/exportações do tenant autenticado
// @Tags         Reports
// @Param        season_id query string false "ID do evento para filtrar o histórico"
// @Param        page      query int    false "Número da página (padrão: 1)"
// @Param        limit     query int    false "Quantidade por página (padrão: 10, máximo: 100)"
// @Produce      json
// @Success      200  {object}  httpx.SuccessEnvelope
// @Failure      401  {object}  httpx.ErrorEnvelope "Não autenticado"
// @Failure      403  {object}  httpx.ErrorEnvelope "Tenant não associado ou bloqueado"
// @Failure      500  {object}  httpx.ErrorEnvelope "Erro interno"
// @Router       /api/v1/reports/history [get]
func (h *ReportHandler) ListHistory(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	if tenantID == "" {
		httpx.Error(w, http.StatusForbidden, "Tenant is required", nil)
		return
	}

	seasonID := r.URL.Query().Get("season_id")
	page := 1
	limit := 10
	if pStr := r.URL.Query().Get("page"); pStr != "" {
		if p, err := strconv.Atoi(pStr); err == nil && p > 0 {
			page = p
		}
	}
	if lStr := r.URL.Query().Get("limit"); lStr != "" {
		if l, err := strconv.Atoi(lStr); err == nil && l > 0 {
			limit = l
		}
	}

	res, err := h.service.ListJobs(r.Context(), reportport.ListFilter{
		TenantID: tenantID,
		SeasonID: seasonID,
		Page:     page,
		Limit:    limit,
	})
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "Falha ao listar histórico de relatórios", nil)
		return
	}

	httpx.Success(w, res)
}

// GetJob godoc
// @Summary      Obter detalhes de um job de exportação
// @Description  Retorna os detalhes e status de um job de exportação do tenant autenticado
// @Tags         Reports
// @Param        id   path   string true "ID do job"
// @Produce      json
// @Success      200  {object}  httpx.SuccessEnvelope
// @Failure      401  {object}  httpx.ErrorEnvelope "Não autenticado"
// @Failure      403  {object}  httpx.ErrorEnvelope "Tenant não associado ou bloqueado"
// @Failure      404  {object}  httpx.ErrorEnvelope "Job não encontrado"
// @Failure      500  {object}  httpx.ErrorEnvelope "Erro interno"
// @Router       /api/v1/reports/jobs/{id} [get]
func (h *ReportHandler) GetJob(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	if tenantID == "" {
		httpx.Error(w, http.StatusForbidden, "Tenant is required", nil)
		return
	}

	jobID := r.PathValue("id")
	if jobID == "" {
		httpx.Error(w, http.StatusBadRequest, "ID do job é obrigatório", nil)
		return
	}

	job, err := h.service.GetJob(r.Context(), jobID, tenantID)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "Job não encontrado", nil)
		return
	}

	httpx.Success(w, job)
}

// DownloadDirectClientsPDF godoc
// @Summary      Download direto do relatório PDF de clientes
// @Description  Gera e faz o download direto instantâneo do relatório consolidado em formato PDF
// @Tags         Reports
// @Param        season_id query string false "ID do evento para filtrar o relatório"
// @Produce      application/pdf
// @Success      200  {string}  string "Arquivo PDF"
// @Failure      401  {object}  httpx.ErrorEnvelope "Não autenticado"
// @Failure      403  {object}  httpx.ErrorEnvelope "Tenant não associado ou bloqueado"
// @Failure      500  {object}  httpx.ErrorEnvelope "Erro interno"
// @Router       /api/v1/reports/clients-pdf [get]
func (h *ReportHandler) DownloadDirectClientsPDF(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	if tenantID == "" {
		httpx.Error(w, http.StatusForbidden, "Tenant is required", nil)
		return
	}

	seasonID := r.URL.Query().Get("season_id")

	pdfData, err := h.service.GenerateDirectClientsPDF(r.Context(), tenantID, seasonID)
	if err != nil {
		if handleReportTenantError(w, err) {
			return
		}
		httpx.Error(w, http.StatusInternalServerError, "Falha ao gerar relatório PDF", nil)
		return
	}

	fileName := fmt.Sprintf("clientes_%d.pdf", time.Now().UTC().Unix())
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", fileName))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(pdfData)
}

// DownloadReport godoc
// @Summary      Baixar arquivo de relatório gerado
// @Description  Permite o download seguro de um arquivo de relatório previamente gerado, validando isolamento de tenant
// @Tags         Reports
// @Param        file query string true "Caminho relativo do arquivo de relatório"
// @Produce      text/csv,application/pdf
// @Success      200  {string}  string "Arquivo de relatório"
// @Failure      400  {object}  httpx.ErrorEnvelope "Parâmetro inválido"
// @Failure      401  {object}  httpx.ErrorEnvelope "Não autenticado"
// @Failure      403  {object}  httpx.ErrorEnvelope "Acesso não autorizado ao arquivo"
// @Failure      404  {object}  httpx.ErrorEnvelope "Arquivo não encontrado"
// @Failure      500  {object}  httpx.ErrorEnvelope "Erro interno"
// @Router       /api/v1/reports/download [get]
func (h *ReportHandler) DownloadReport(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	if tenantID == "" {
		httpx.Error(w, http.StatusForbidden, "Tenant is required", nil)
		return
	}

	filePath := r.URL.Query().Get("file")
	if filePath == "" {
		httpx.Error(w, http.StatusBadRequest, "Parâmetro 'file' é obrigatório", nil)
		return
	}

	data, err := h.service.GetReportFile(r.Context(), tenantID, filePath)
	if err != nil {
		if handleReportTenantError(w, err) {
			return
		}
		if errors.Is(err, reportusecase.ErrUnauthorizedTenant) || errors.Is(err, reportusecase.ErrInvalidReportPath) {
			httpx.Error(w, http.StatusForbidden, "Acesso não autorizado a este relatório", nil)
			return
		}
		httpx.Error(w, http.StatusNotFound, "Relatório não encontrado ou expirado", nil)
		return
	}

	fileName := filepath.Base(filePath)
	contentType := "text/csv; charset=utf-8"
	if strings.HasSuffix(strings.ToLower(fileName), ".pdf") {
		contentType = "application/pdf"
	}
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", fileName))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(data)
}
