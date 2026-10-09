package report

import (
	"context"
	"time"

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
	FindByFilePath(ctx context.Context, tenantID, filePath string) (*reportdomain.ReportJob, error)
	List(ctx context.Context, filter ListFilter) (*ListResult, error)
	FindExpiredCompleted(ctx context.Context, cutoff time.Time, limit int) ([]*reportdomain.ReportJob, error)
	MarkAsExpired(ctx context.Context, id string, expiredAt time.Time) error
}
