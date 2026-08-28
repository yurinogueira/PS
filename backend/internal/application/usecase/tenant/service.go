package tenant

import (
	"context"
	"errors"
	"regexp"
	"strings"
	"time"

	tenantport "ps/internal/application/ports/tenant"
	domaintenant "ps/internal/domain/tenant"
)

var (
	ErrInvalidName   = errors.New("invalid tenant name")
	ErrAlreadyExists = tenantport.ErrAlreadyExists
	ErrNotFound      = tenantport.ErrNotFound

	validNameRegex = regexp.MustCompile(`^[a-zA-Z0-9_\-]+$`)
)

type Service struct {
	repo tenantport.Repository
}

func NewService(repo tenantport.Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, name string) (domaintenant.Tenant, error) {
	cleanName := strings.TrimSpace(name)
	if cleanName == "" || len(cleanName) > 128 || !validNameRegex.MatchString(cleanName) {
		return domaintenant.Tenant{}, ErrInvalidName
	}

	// Check if already exists
	if _, err := s.repo.FindByName(ctx, cleanName); err == nil {
		return domaintenant.Tenant{}, ErrAlreadyExists
	}

	t := domaintenant.Tenant{
		Name:      cleanName,
		CreatedAt: time.Now().UTC(),
	}

	return s.repo.Create(ctx, t)
}

func (s *Service) List(ctx context.Context) ([]domaintenant.Tenant, error) {
	return s.repo.List(ctx)
}

func (s *Service) GetByName(ctx context.Context, name string) (domaintenant.Tenant, error) {
	cleanName := strings.TrimSpace(name)
	if cleanName == "" {
		return domaintenant.Tenant{}, ErrInvalidName
	}
	return s.repo.FindByName(ctx, cleanName)
}
