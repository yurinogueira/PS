package season

import (
	"context"
	"ps/internal/domain/season"
)

type Repository interface {
	Create(ctx context.Context, season *season.Season) error
	GetByID(ctx context.Context, id string) (*season.Season, error)
	List(ctx context.Context) ([]*season.Season, error)
	Update(ctx context.Context, season *season.Season) error
	Delete(ctx context.Context, id string) error
}
