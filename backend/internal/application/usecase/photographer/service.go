package photographer

import (
	"context"
	"ps/internal/application/ports/photographer"
	domain "ps/internal/domain/photographer"
)

type Service struct {
	repo photographer.Repository
}

func NewService(repo photographer.Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, photographer *domain.Photographer) error {
	return s.repo.Create(ctx, photographer)
}

func (s *Service) GetByID(ctx context.Context, id string) (*domain.Photographer, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) List(ctx context.Context) ([]*domain.Photographer, error) {
	return s.repo.List(ctx)
}

func (s *Service) Update(ctx context.Context, photographer *domain.Photographer) error {
	return s.repo.Update(ctx, photographer)
}

func (s *Service) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}
