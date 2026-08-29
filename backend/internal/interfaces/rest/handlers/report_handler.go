package handlers

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"path/filepath"
	"time"

	userport "ps/internal/application/ports/user"
	reportusecase "ps/internal/application/usecase/report"
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

// ExportClientsCSV godoc
// @Summary      Exportar relatório CSV de clientes
// @Description  Inicia a extração assíncrona do relatório consolidado de clientes, cães, fotos e pagamentos do tenant autenticado e envia o link para o e-mail cadastrado
// @Tags         Reports
// @Produce      json
// @Success      202  {object}  httpx.SuccessEnvelope
// @Failure      401  {object}  httpx.ErrorEnvelope "Não autenticado"
// @Failure      403  {object}  httpx.ErrorEnvelope "Tenant não associado"
// @Failure      500  {object}  httpx.ErrorEnvelope "Erro interno"
// @Router       /api/v1/reports/clients-csv [post]
func (h *ReportHandler) ExportClientsCSV(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	if tenantID == "" {
		httpx.Error(w, http.StatusForbidden, "Tenant is required", nil)
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
	go func(tID, uEmail, uName string) {
		jobCtx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
		defer cancel()

		if _, err := h.service.GenerateClientsCSV(jobCtx, tID, uEmail, uName); err != nil {
			log.Printf("[REPORT-JOB-ERROR] Failed to generate clients CSV for tenant %s: %v", tID, err)
		}
	}(tenantID, userEmail, userName)

	httpx.Accepted(w, map[string]string{
		"message": "Geração do relatório iniciada com sucesso. O arquivo CSV será enviado para o seu e-mail em instantes.",
	})
}

// DownloadReport godoc
// @Summary      Baixar arquivo de relatório gerado
// @Description  Permite o download seguro de um arquivo de relatório previamente gerado, validando isolamento de tenant
// @Tags         Reports
// @Param        file query string true "Caminho relativo do arquivo de relatório"
// @Produce      text/csv
// @Success      200  {string}  string "Arquivo CSV"
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
		if errors.Is(err, reportusecase.ErrUnauthorizedTenant) || errors.Is(err, reportusecase.ErrInvalidReportPath) {
			httpx.Error(w, http.StatusForbidden, "Acesso não autorizado a este relatório", nil)
			return
		}
		httpx.Error(w, http.StatusNotFound, "Relatório não encontrado ou expirado", nil)
		return
	}

	fileName := filepath.Base(filePath)
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", fileName))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(data)
}
