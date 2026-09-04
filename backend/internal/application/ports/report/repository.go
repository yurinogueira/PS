package report

import (
	"context"
	reportdomain "ps/internal/domain/report"
)

type ListFilter struct {
	TenantID string
	SeasonID string
	Page     int
	Limit    int
}

type ListResult struct {
	Jobs  []*reportdomain.ReportJob `json:"jobs"`
	Total int64                     `json:"total"`
	Page  int                       `json:"page"`
	Limit int                       `json:"limit"`
}

type Repository interface {
	Create(ctx context.Context, job *reportdomain.ReportJob) error
	Update(ctx context.Context, job *reportdomain.ReportJob) error
	GetByID(ctx context.Context, id, tenantID string) (*reportdomain.ReportJob, error)
	List(ctx context.Context, filter ListFilter) (*ListResult, error)
}
