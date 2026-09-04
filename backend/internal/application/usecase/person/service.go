package person

import (
	"context"

	"ps/internal/application/ports/person"
	tenantport "ps/internal/application/ports/tenant"
	auditusecase "ps/internal/application/usecase/auditlog"
	domainaudit "ps/internal/domain/auditlog"
	domain "ps/internal/domain/person"
)

type Service struct {
	repo            person.Repository
	tenantValidator tenantport.Validator
	auditor         *auditusecase.Service
}

func NewService(repo person.Repository, validator ...tenantport.Validator) *Service {
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

func (s *Service) Create(ctx context.Context, person *domain.Person, tenantID string) error {
	if s.tenantValidator != nil {
		if err := s.tenantValidator.ValidateCanWriteEntities(ctx, tenantID); err != nil {
			return err
		}
	}
	person.TenantID = tenantID
	if err := s.repo.Create(ctx, person); err != nil {
		return err
	}
	if s.auditor != nil {
		s.auditor.RecordMutation(ctx, tenantID, domainaudit.EntityPerson, person.ID, domainaudit.ActionCreate, nil, person)
	}
	return nil
}

func (s *Service) GetByID(ctx context.Context, id, tenantID string) (*domain.Person, error) {
	return s.repo.GetByID(ctx, id, tenantID)
}

func (s *Service) List(ctx context.Context, tenantID string) ([]*domain.Person, error) {
	return s.repo.List(ctx, tenantID)
}

func (s *Service) Update(ctx context.Context, person *domain.Person, tenantID string) error {
	if s.tenantValidator != nil {
		if err := s.tenantValidator.ValidateCanWriteEntities(ctx, tenantID); err != nil {
			return err
		}
	}
	var oldPerson *domain.Person
	if s.auditor != nil {
		oldPerson, _ = s.repo.GetByID(ctx, person.ID, tenantID)
	}
	person.TenantID = tenantID
	if err := s.repo.Update(ctx, person); err != nil {
		return err
	}
	if s.auditor != nil {
		s.auditor.RecordMutation(ctx, tenantID, domainaudit.EntityPerson, person.ID, domainaudit.ActionUpdate, oldPerson, person)
	}
	return nil
}

func (s *Service) Delete(ctx context.Context, id, tenantID string) error {
	if s.tenantValidator != nil {
		if err := s.tenantValidator.ValidateCanWriteEntities(ctx, tenantID); err != nil {
			return err
		}
	}
	var oldPerson *domain.Person
	if s.auditor != nil {
		oldPerson, _ = s.repo.GetByID(ctx, id, tenantID)
	}
	if err := s.repo.Delete(ctx, id, tenantID); err != nil {
		return err
	}
	if s.auditor != nil {
		s.auditor.RecordMutation(ctx, tenantID, domainaudit.EntityPerson, id, domainaudit.ActionDelete, oldPerson, nil)
	}
	return nil
}
