package season

import (
	"context"
	"log"
	"time"

	clientport "ps/internal/application/ports/client"
	"ps/internal/application/ports/season"
	tenantport "ps/internal/application/ports/tenant"
	auditusecase "ps/internal/application/usecase/auditlog"
	domainaudit "ps/internal/domain/auditlog"
	domain "ps/internal/domain/season"
)

type Service struct {
	repo            season.Repository
	clientRepo      clientport.Repository
	tenantValidator tenantport.Validator
	auditor         *auditusecase.Service
}

func NewService(repo season.Repository, clientRepo clientport.Repository, validator ...tenantport.Validator) *Service {
	var tv tenantport.Validator
	if len(validator) > 0 {
		tv = validator[0]
	}
	return &Service{
		repo:            repo,
		clientRepo:      clientRepo,
		tenantValidator: tv,
	}
}

func (s *Service) WithAuditor(auditor *auditusecase.Service) *Service {
	s.auditor = auditor
	return s
}

func (s *Service) Create(ctx context.Context, season *domain.Season, tenantID string) error {
	if s.tenantValidator != nil {
		if err := s.tenantValidator.ValidateCanCreateSeason(ctx, tenantID); err != nil {
			return err
		}
	}
	season.TenantID = tenantID
	if err := s.repo.Create(ctx, season); err != nil {
		return err
	}
	if s.auditor != nil {
		s.auditor.RecordMutation(ctx, tenantID, domainaudit.EntitySeason, season.ID, domainaudit.ActionCreate, nil, season)
	}
	return nil
}

func (s *Service) GetByID(ctx context.Context, id, tenantID string) (*domain.Season, error) {
	return s.repo.GetByID(ctx, id, tenantID)
}

func (s *Service) List(ctx context.Context, tenantID string) ([]*domain.Season, error) {
	return s.repo.List(ctx, tenantID)
}

func (s *Service) Update(ctx context.Context, season *domain.Season, tenantID string) error {
	if s.tenantValidator != nil {
		if err := s.tenantValidator.ValidateCanWriteEntities(ctx, tenantID); err != nil {
			return err
		}
	}
	var oldSeason *domain.Season
	if s.auditor != nil {
		oldSeason, _ = s.repo.GetByID(ctx, season.ID, tenantID)
	}
	season.TenantID = tenantID
	if err := s.repo.Update(ctx, season); err != nil {
		return err
	}
	if s.auditor != nil {
		s.auditor.RecordMutation(ctx, tenantID, domainaudit.EntitySeason, season.ID, domainaudit.ActionUpdate, oldSeason, season)
	}
	return nil
}

func (s *Service) Delete(ctx context.Context, id, tenantID string) error {
	if s.tenantValidator != nil {
		if err := s.tenantValidator.ValidateCanWriteEntities(ctx, tenantID); err != nil {
			return err
		}
	}
	var oldSeason *domain.Season
	if s.auditor != nil {
		oldSeason, _ = s.repo.GetByID(ctx, id, tenantID)
	}
	if err := s.repo.Delete(ctx, id, tenantID); err != nil {
		return err
	}
	if s.auditor != nil {
		s.auditor.RecordMutation(ctx, tenantID, domainaudit.EntitySeason, id, domainaudit.ActionDelete, oldSeason, nil)
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
