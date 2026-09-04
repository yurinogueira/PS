package photographer

import (
	"context"

	"ps/internal/application/ports/photographer"
	tenantport "ps/internal/application/ports/tenant"
	auditusecase "ps/internal/application/usecase/auditlog"
	domainaudit "ps/internal/domain/auditlog"
	domain "ps/internal/domain/photographer"
)

type Service struct {
	repo            photographer.Repository
	tenantValidator tenantport.Validator
	auditor         *auditusecase.Service
}

func NewService(repo photographer.Repository, validator ...tenantport.Validator) *Service {
	var tv tenantport.Validator
	if len(validator) > 0 {
		tv = validator[0]
	}
	return &Service{
		repo:            repo,
		tenantValidator: tv,
	}
}

func (s *Service) WithAuditor(auditor *auditusecase.Service) *Service {
	s.auditor = auditor
	return s
}

func (s *Service) Create(ctx context.Context, photographer *domain.Photographer, tenantID string) error {
	if s.tenantValidator != nil {
		if err := s.tenantValidator.ValidateCanWriteEntities(ctx, tenantID); err != nil {
			return err
		}
	}
	photographer.TenantID = tenantID
	if err := s.repo.Create(ctx, photographer); err != nil {
		return err
	}
	if s.auditor != nil {
		s.auditor.RecordMutation(ctx, tenantID, domainaudit.EntityPhotographer, photographer.ID, domainaudit.ActionCreate, nil, photographer)
	}
	return nil
}

func (s *Service) GetByID(ctx context.Context, id, tenantID string) (*domain.Photographer, error) {
	return s.repo.GetByID(ctx, id, tenantID)
}

func (s *Service) List(ctx context.Context, tenantID string) ([]*domain.Photographer, error) {
	return s.repo.List(ctx, tenantID)
}

func (s *Service) Update(ctx context.Context, photographer *domain.Photographer, tenantID string) error {
	if s.tenantValidator != nil {
		if err := s.tenantValidator.ValidateCanWriteEntities(ctx, tenantID); err != nil {
			return err
		}
	}
	var oldPhotographer *domain.Photographer
	if s.auditor != nil {
		oldPhotographer, _ = s.repo.GetByID(ctx, photographer.ID, tenantID)
	}
	photographer.TenantID = tenantID
	if err := s.repo.Update(ctx, photographer); err != nil {
		return err
	}
	if s.auditor != nil {
		s.auditor.RecordMutation(ctx, tenantID, domainaudit.EntityPhotographer, photographer.ID, domainaudit.ActionUpdate, oldPhotographer, photographer)
	}
	return nil
}

func (s *Service) Delete(ctx context.Context, id, tenantID string) error {
	if s.tenantValidator != nil {
		if err := s.tenantValidator.ValidateCanWriteEntities(ctx, tenantID); err != nil {
			return err
		}
	}
	var oldPhotographer *domain.Photographer
	if s.auditor != nil {
		oldPhotographer, _ = s.repo.GetByID(ctx, id, tenantID)
	}
	if err := s.repo.Delete(ctx, id, tenantID); err != nil {
		return err
	}
	if s.auditor != nil {
		s.auditor.RecordMutation(ctx, tenantID, domainaudit.EntityPhotographer, id, domainaudit.ActionDelete, oldPhotographer, nil)
	}
	return nil
}
