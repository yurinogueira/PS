package photographer

import (
	"context"

	"ps/internal/application/ports/photographer"
	tenantport "ps/internal/application/ports/tenant"
	domain "ps/internal/domain/photographer"
)

type Service struct {
	repo            photographer.Repository
	tenantValidator tenantport.Validator
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

func (s *Service) Create(ctx context.Context, photographer *domain.Photographer, tenantID string) error {
	if s.tenantValidator != nil {
		if err := s.tenantValidator.ValidateCanWriteEntities(ctx, tenantID); err != nil {
			return err
		}
	}
	photographer.TenantID = tenantID
	return s.repo.Create(ctx, photographer)
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
	photographer.TenantID = tenantID
	return s.repo.Update(ctx, photographer)
}

func (s *Service) Delete(ctx context.Context, id, tenantID string) error {
	if s.tenantValidator != nil {
		if err := s.tenantValidator.ValidateCanWriteEntities(ctx, tenantID); err != nil {
			return err
		}
	}
	return s.repo.Delete(ctx, id, tenantID)
}
