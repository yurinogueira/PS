package admin

import (
	"context"
	"errors"
	"strings"
	"time"

	tenantport "ps/internal/application/ports/tenant"
	userport "ps/internal/application/ports/user"
	domainuser "ps/internal/domain/user"
)

var (
	ErrUserNotFound   = userport.ErrNotFound
	ErrTenantNotFound = tenantport.ErrNotFound
	ErrInvalidInput   = errors.New("invalid input")
)

type Service struct {
	users   userport.Repository
	tenants tenantport.Repository
}

func NewService(users userport.Repository, tenants tenantport.Repository) *Service {
	return &Service{
		users:   users,
		tenants: tenants,
	}
}

func (s *Service) ListUsers(ctx context.Context) ([]domainuser.User, error) {
	return s.users.List(ctx)
}

func (s *Service) AssignTenant(ctx context.Context, userID, tenantID string) (domainuser.User, error) {
	cleanUserID := strings.TrimSpace(userID)
	if cleanUserID == "" {
		return domainuser.User{}, ErrInvalidInput
	}

	cleanTenantID := strings.TrimSpace(tenantID)

	// If a tenantID is provided, verify that the tenant actually exists
	if cleanTenantID != "" {
		if _, err := s.tenants.FindByName(ctx, cleanTenantID); err != nil {
			return domainuser.User{}, ErrTenantNotFound
		}
	}

	u, err := s.users.FindByID(ctx, cleanUserID)
	if err != nil {
		return domainuser.User{}, ErrUserNotFound
	}

	u.TenantID = cleanTenantID
	u.UpdatedAt = time.Now().UTC()

	return s.users.Update(ctx, u)
}
