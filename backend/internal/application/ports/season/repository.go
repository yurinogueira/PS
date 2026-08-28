package season

import (
	"context"
	"ps/internal/domain/season"
)

type Repository interface {
	Create(ctx context.Context, season *season.Season) error
	GetByID(ctx context.Context, id, tenantID string) (*season.Season, error)
	List(ctx context.Context, tenantID string) ([]*season.Season, error)
	Update(ctx context.Context, season *season.Season) error
	Delete(ctx context.Context, id, tenantID string) error
}
