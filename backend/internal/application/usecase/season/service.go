package season

import (
	"context"
	"ps/internal/application/ports/season"
	domain "ps/internal/domain/season"
)

type Service struct {
	repo season.Repository
}

func NewService(repo season.Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, season *domain.Season, tenantID string) error {
	season.TenantID = tenantID
	return s.repo.Create(ctx, season)
}

func (s *Service) GetByID(ctx context.Context, id, tenantID string) (*domain.Season, error) {
	return s.repo.GetByID(ctx, id, tenantID)
}

func (s *Service) List(ctx context.Context, tenantID string) ([]*domain.Season, error) {
	return s.repo.List(ctx, tenantID)
}

func (s *Service) Update(ctx context.Context, season *domain.Season, tenantID string) error {
	season.TenantID = tenantID
	return s.repo.Update(ctx, season)
}

func (s *Service) Delete(ctx context.Context, id, tenantID string) error {
	return s.repo.Delete(ctx, id, tenantID)
}
