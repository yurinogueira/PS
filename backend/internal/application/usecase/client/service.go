package client

import (
	"context"
	"errors"

	clientport "ps/internal/application/ports/client"
	personport "ps/internal/application/ports/person"
	photographerport "ps/internal/application/ports/photographer"
	seasonport "ps/internal/application/ports/season"
	tenantport "ps/internal/application/ports/tenant"
	domain "ps/internal/domain/client"
)

var (
	ErrPersonNotFound       = errors.New("person not found or does not belong to tenant")
	ErrSeasonNotFound       = errors.New("season not found or does not belong to tenant")
	ErrPhotographerNotFound = errors.New("photographer not found or does not belong to tenant")
	ErrClientNotFound       = errors.New("client not found or does not belong to tenant")
)

type Service struct {
	repo             clientport.Repository
	personRepo       personport.Repository
	seasonRepo       seasonport.Repository
	photographerRepo photographerport.Repository
	tenantValidator  tenantport.Validator
}

func NewService(
	repo clientport.Repository,
	personRepo personport.Repository,
	seasonRepo seasonport.Repository,
	photographerRepo photographerport.Repository,
	validator ...tenantport.Validator,
) *Service {
	var tv tenantport.Validator
	if len(validator) > 0 {
		tv = validator[0]
	}
	return &Service{
		repo:             repo,
		personRepo:       personRepo,
		seasonRepo:       seasonRepo,
		photographerRepo: photographerRepo,
		tenantValidator:  tv,
	}
}

func (s *Service) validateReferences(ctx context.Context, c *domain.SeasonClient, tenantID string) error {
	if s.personRepo != nil {
		if c.PersonID == "" {
			return ErrPersonNotFound
		}
		person, err := s.personRepo.GetByID(ctx, c.PersonID, tenantID)
		if err != nil || person == nil {
			return ErrPersonNotFound
		}
	}

	if s.seasonRepo != nil {
		if c.SeasonID == "" {
			return ErrSeasonNotFound
		}
		season, err := s.seasonRepo.GetByID(ctx, c.SeasonID, tenantID)
		if err != nil || season == nil {
			return ErrSeasonNotFound
		}
	}

	if s.photographerRepo != nil {
		validatedPhotographers := make(map[string]bool)
		for _, dog := range c.Dogs {
			for _, photo := range dog.Photos {
				if photo.PhotographerID != "" {
					if validatedPhotographers[photo.PhotographerID] {
						continue
					}
					photog, err := s.photographerRepo.GetByID(ctx, photo.PhotographerID, tenantID)
					if err != nil || photog == nil {
						return ErrPhotographerNotFound
					}
					validatedPhotographers[photo.PhotographerID] = true
				}
			}
		}
	}

	return nil
}

func (s *Service) Create(ctx context.Context, client *domain.SeasonClient, tenantID string) error {
	if s.tenantValidator != nil {
		if err := s.tenantValidator.ValidateCanWriteClients(ctx, tenantID); err != nil {
			return err
		}
	}
	client.TenantID = tenantID
	if err := s.validateReferences(ctx, client, tenantID); err != nil {
		return err
	}
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
	if s.tenantValidator != nil {
		if err := s.tenantValidator.ValidateCanWriteClients(ctx, tenantID); err != nil {
			return err
		}
	}
	client.TenantID = tenantID
	if _, err := s.repo.GetByID(ctx, client.ID, tenantID); err != nil {
		return ErrClientNotFound
	}
	if err := s.validateReferences(ctx, client, tenantID); err != nil {
		return err
	}
	return s.repo.Update(ctx, client)
}

func (s *Service) Delete(ctx context.Context, id, tenantID string) error {
	if s.tenantValidator != nil {
		if err := s.tenantValidator.ValidateCanWriteClients(ctx, tenantID); err != nil {
			return err
		}
	}
	return s.repo.Delete(ctx, id, tenantID)
}
