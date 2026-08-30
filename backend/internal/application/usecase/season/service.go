package season

import (
	"context"
	"log"
	"time"

	clientport "ps/internal/application/ports/client"
	"ps/internal/application/ports/season"
	domain "ps/internal/domain/season"
)

type Service struct {
	repo       season.Repository
	clientRepo clientport.Repository
}

func NewService(repo season.Repository, clientRepo clientport.Repository) *Service {
	return &Service{
		repo:       repo,
		clientRepo: clientRepo,
	}
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
	if err := s.repo.Delete(ctx, id, tenantID); err != nil {
		return err
	}

	if s.clientRepo != nil {
		go func(seasonID, tID string) {
			bgCtx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
			defer cancel()

			if err := s.clientRepo.DeleteBySeasonID(bgCtx, seasonID, tID); err != nil {
				log.Printf("[SEASON-CASCADE-DELETE-ERROR] Failed to cascade delete clients for season %s (tenant %s): %v", seasonID, tID, err)
			}
		}(id, tenantID)
	}

	return nil
}
