package person

import (
	"context"
	"ps/internal/application/ports/person"
	domain "ps/internal/domain/person"
)

type Service struct {
	repo person.Repository
}

func NewService(repo person.Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, person *domain.Person, tenantID string) error {
	person.TenantID = tenantID
	return s.repo.Create(ctx, person)
}

func (s *Service) GetByID(ctx context.Context, id, tenantID string) (*domain.Person, error) {
	return s.repo.GetByID(ctx, id, tenantID)
}

func (s *Service) List(ctx context.Context, tenantID string) ([]*domain.Person, error) {
	return s.repo.List(ctx, tenantID)
}

func (s *Service) Update(ctx context.Context, person *domain.Person, tenantID string) error {
	person.TenantID = tenantID
	return s.repo.Update(ctx, person)
}

func (s *Service) Delete(ctx context.Context, id, tenantID string) error {
	return s.repo.Delete(ctx, id, tenantID)
}
