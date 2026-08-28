package photographer

import (
	"context"
	"ps/internal/domain/photographer"
)

type Repository interface {
	Create(ctx context.Context, photographer *photographer.Photographer) error
	GetByID(ctx context.Context, id, tenantID string) (*photographer.Photographer, error)
	List(ctx context.Context, tenantID string) ([]*photographer.Photographer, error)
	Update(ctx context.Context, photographer *photographer.Photographer) error
	Delete(ctx context.Context, id, tenantID string) error
}
