package client

import (
	"context"
	"ps/internal/application/ports/client"
	domain "ps/internal/domain/client"
)

type Service struct {
	repo client.Repository
}

func NewService(repo client.Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, client *domain.SeasonClient) error {
	return s.repo.Create(ctx, client)
}

func (s *Service) GetByID(ctx context.Context, id string) (*domain.SeasonClient, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) List(ctx context.Context) ([]*domain.SeasonClient, error) {
	return s.repo.List(ctx)
}

func (s *Service) Update(ctx context.Context, client *domain.SeasonClient) error {
	return s.repo.Update(ctx, client)
}

func (s *Service) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}
