package auditlog

import (
	"context"
	"time"

	domainaudit "ps/internal/domain/auditlog"
)

type Filter struct {
	TenantID   string
	EntityType domainaudit.EntityType
	Action     domainaudit.Action
	UserID     string
	StartDate  *time.Time
	EndDate    *time.Time
	Page       int
	Limit      int
}

type PaginatedResult struct {
	Items      []domainaudit.AuditLog `json:"items"`
	Total      int64                  `json:"total"`
	Page       int                    `json:"page"`
	Limit      int                    `json:"limit"`
	TotalPages int                    `json:"totalPages"`
}

type Repository interface {
	Create(ctx context.Context, log *domainaudit.AuditLog) error
	List(ctx context.Context, filter Filter) (PaginatedResult, error)
}
