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

func (s *Service) Create(ctx context.Context, person *domain.Person) error {
	return s.repo.Create(ctx, person)
}

func (s *Service) GetByID(ctx context.Context, id string) (*domain.Person, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) List(ctx context.Context) ([]*domain.Person, error) {
	return s.repo.List(ctx)
}

func (s *Service) Update(ctx context.Context, person *domain.Person) error {
	return s.repo.Update(ctx, person)
}

func (s *Service) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}
