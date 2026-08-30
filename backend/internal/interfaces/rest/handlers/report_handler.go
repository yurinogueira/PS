package handlers

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	userport "ps/internal/application/ports/user"
	reportusecase "ps/internal/application/usecase/report"
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

	if err := h.service.ValidateAccess(r.Context(), tenantID, seasonID); err != nil {
		if handleReportTenantError(w, err) {
			return
		}
		httpx.Error(w, http.StatusInternalServerError, "Failed to validate report access", nil)
		return
	}

	userID := middleware.GetUserID(r.Context())
	var userEmail, userName string
	if userID != "" && h.userRepo != nil {
		user, err := h.userRepo.FindByID(r.Context(), userID)
		if err == nil && user.Email != "" {
			userEmail = user.Email
			userName = user.Name
		}
	}

	// Launch async extraction job in background goroutine with detached context
	go func(tID, sID, uEmail, uName string) {
		jobCtx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
		defer cancel()

		if _, err := h.service.GenerateClientsCSV(jobCtx, tID, sID, uEmail, uName); err != nil {
			log.Printf("[REPORT-JOB-ERROR] Failed to generate clients CSV for tenant %s: %v", tID, err)
		}
	}(tenantID, seasonID, userEmail, userName)

	httpx.Accepted(w, map[string]string{
		"message": "Geração do relatório iniciada com sucesso. O arquivo CSV será enviado para o seu e-mail em instantes.",
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

	if err := h.service.ValidateAccess(r.Context(), tenantID, seasonID); err != nil {
		if handleReportTenantError(w, err) {
			return
		}
		httpx.Error(w, http.StatusInternalServerError, "Failed to validate report access", nil)
		return
	}

	userID := middleware.GetUserID(r.Context())
	var userEmail, userName string
	if userID != "" && h.userRepo != nil {
		user, err := h.userRepo.FindByID(r.Context(), userID)
		if err == nil && user.Email != "" {
			userEmail = user.Email
			userName = user.Name
		}
	}

	// Launch async extraction job in background goroutine with detached context
	go func(tID, sID, uEmail, uName string) {
		jobCtx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
		defer cancel()

		if _, err := h.service.GenerateUnpaidClientsCSV(jobCtx, tID, sID, uEmail, uName); err != nil {
			log.Printf("[REPORT-JOB-ERROR] Failed to generate unpaid clients CSV for tenant %s: %v", tID, err)
		}
	}(tenantID, seasonID, userEmail, userName)

	httpx.Accepted(w, map[string]string{
		"message": "Geração do relatório iniciada com sucesso. O arquivo CSV será enviado para o seu e-mail em instantes.",
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

	if err := h.service.ValidateAccess(r.Context(), tenantID, seasonID); err != nil {
		if handleReportTenantError(w, err) {
			return
		}
		httpx.Error(w, http.StatusInternalServerError, "Failed to validate report access", nil)
		return
	}

	userID := middleware.GetUserID(r.Context())
	var userEmail, userName string
	if userID != "" && h.userRepo != nil {
		user, err := h.userRepo.FindByID(r.Context(), userID)
		if err == nil && user.Email != "" {
			userEmail = user.Email
			userName = user.Name
		}
	}

	// Launch async extraction job in background goroutine with detached context
	go func(tID, sID, uEmail, uName string) {
		jobCtx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
		defer cancel()

		if _, err := h.service.GeneratePaidClientsCSV(jobCtx, tID, sID, uEmail, uName); err != nil {
			log.Printf("[REPORT-JOB-ERROR] Failed to generate paid clients CSV for tenant %s: %v", tID, err)
		}
	}(tenantID, seasonID, userEmail, userName)

	httpx.Accepted(w, map[string]string{
		"message": "Geração do relatório iniciada com sucesso. O arquivo CSV será enviado para o seu e-mail em instantes.",
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

	if err := h.service.ValidateAccess(r.Context(), tenantID, seasonID); err != nil {
		if handleReportTenantError(w, err) {
			return
		}
		httpx.Error(w, http.StatusInternalServerError, "Failed to validate report access", nil)
		return
	}

	userID := middleware.GetUserID(r.Context())
	var userEmail, userName string
	if userID != "" && h.userRepo != nil {
		user, err := h.userRepo.FindByID(r.Context(), userID)
		if err == nil && user.Email != "" {
			userEmail = user.Email
			userName = user.Name
		}
	}

	// Launch async extraction job in background goroutine with detached context
	go func(tID, sID, uEmail, uName string) {
		jobCtx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
		defer cancel()

		if _, err := h.service.GenerateClientsPDF(jobCtx, tID, sID, uEmail, uName); err != nil {
			log.Printf("[REPORT-JOB-ERROR] Failed to generate clients PDF for tenant %s: %v", tID, err)
		}
	}(tenantID, seasonID, userEmail, userName)

	httpx.Accepted(w, map[string]string{
		"message": "Geração do relatório em PDF iniciada com sucesso. O arquivo será enviado para o seu e-mail em instantes.",
	})
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
