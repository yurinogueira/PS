package tenant

import (
	"context"
	"errors"

	domaintenant "ps/internal/domain/tenant"
)

var (
	ErrNotFound      = errors.New("tenant not found")
	ErrAlreadyExists = errors.New("tenant already exists")
)

type Repository interface {
	Create(ctx context.Context, tenant domaintenant.Tenant) (domaintenant.Tenant, error)
	FindByName(ctx context.Context, name string) (domaintenant.Tenant, error)
	List(ctx context.Context) ([]domaintenant.Tenant, error)
	Update(ctx context.Context, tenant domaintenant.Tenant) (domaintenant.Tenant, error)
}

type Validator interface {
	ValidateCanCreateSeason(ctx context.Context, tenantID string) error
	ValidateCanExportReport(ctx context.Context, tenantID, seasonID string) error
	ValidateCanWriteClients(ctx context.Context, tenantID string) error
	ValidateCanWriteEntities(ctx context.Context, tenantID string) error
}
