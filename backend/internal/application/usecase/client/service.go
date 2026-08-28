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

func (s *Service) Create(ctx context.Context, client *domain.SeasonClient, tenantID string) error {
	client.TenantID = tenantID
	return s.repo.Create(ctx, client)
}

func (s *Service) GetByID(ctx context.Context, id, tenantID string) (*domain.SeasonClient, error) {
	return s.repo.GetByID(ctx, id, tenantID)
}

func (s *Service) List(ctx context.Context, tenantID string, filter domain.ListFilter) (*domain.PaginatedClients, error) {
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Limit <= 0 {
		filter.Limit = 10
	}
	if filter.Limit > 100 {
		filter.Limit = 100
	}
	return s.repo.List(ctx, tenantID, filter)
}

func (s *Service) Update(ctx context.Context, client *domain.SeasonClient, tenantID string) error {
	client.TenantID = tenantID
	return s.repo.Update(ctx, client)
}

func (s *Service) Delete(ctx context.Context, id, tenantID string) error {
	return s.repo.Delete(ctx, id, tenantID)
}
