package admin

import (
	"context"
	"errors"
	"strings"
	"time"

	tenantport "ps/internal/application/ports/tenant"
	userport "ps/internal/application/ports/user"
	auditusecase "ps/internal/application/usecase/auditlog"
	domainaudit "ps/internal/domain/auditlog"
	domainuser "ps/internal/domain/user"
)

var (
	ErrUserNotFound     = userport.ErrNotFound
	ErrTenantNotFound   = tenantport.ErrNotFound
	ErrInvalidInput     = errors.New("invalid input")
	ErrInvalidRole      = errors.New("invalid role")
	ErrLastAdminLockout = errors.New("cannot demote the last active administrator")
)

type Service struct {
	users   userport.Repository
	tenants tenantport.Repository
	auditor *auditusecase.Service
}

func NewService(users userport.Repository, tenants tenantport.Repository, auditor ...*auditusecase.Service) *Service {
	var a *auditusecase.Service
	if len(auditor) > 0 {
		a = auditor[0]
	}
	return &Service{
		users:   users,
		tenants: tenants,
		auditor: a,
	}
}

func (s *Service) WithAuditor(auditor *auditusecase.Service) *Service {
	s.auditor = auditor
	return s
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

	oldTenant := u.TenantID
	u.TenantID = cleanTenantID
	u.UpdatedAt = time.Now().UTC()

	updated, err := s.users.Update(ctx, u)
	if err != nil {
		return domainuser.User{}, err
	}

	if s.auditor != nil && oldTenant != cleanTenantID {
		s.auditor.Record(ctx, auditusecase.Entry{
			TenantID:   cleanTenantID,
			EntityType: domainaudit.EntityUser,
			EntityID:   updated.ID,
			Action:     domainaudit.ActionAssignTenant,
			Changes: []domainaudit.Change{
				{
					FieldChanged: "tenantId",
					OldValue:     oldTenant,
					NewValue:     cleanTenantID,
				},
			},
		})
	}

	return updated, nil
}

func (s *Service) UpdateUserRole(ctx context.Context, userID, newRole string) (domainuser.User, error) {
	cleanUserID := strings.TrimSpace(userID)
	if cleanUserID == "" {
		return domainuser.User{}, ErrInvalidInput
	}

	targetRole := domainuser.Role(strings.ToLower(strings.TrimSpace(newRole)))
	if targetRole != domainuser.RoleAdmin && targetRole != domainuser.RoleManager && targetRole != domainuser.RoleUser {
		return domainuser.User{}, ErrInvalidRole
	}

	u, err := s.users.FindByID(ctx, cleanUserID)
	if err != nil {
		return domainuser.User{}, ErrUserNotFound
	}

	oldRole := u.GetRole()
	if oldRole == targetRole {
		return u, nil
	}

	// Lockout protection: cannot demote the last administrator
	if oldRole == domainuser.RoleAdmin && targetRole != domainuser.RoleAdmin {
		allUsers, listErr := s.users.List(ctx)
		if listErr != nil {
			return domainuser.User{}, listErr
		}
		adminCount := 0
		for _, user := range allUsers {
			if user.GetRole() == domainuser.RoleAdmin {
				adminCount++
			}
		}
		if adminCount <= 1 {
			return domainuser.User{}, ErrLastAdminLockout
		}
	}

	u.Role = targetRole
	u.SuperAdmin = (targetRole == domainuser.RoleAdmin)
	u.UpdatedAt = time.Now().UTC()

	updated, err := s.users.Update(ctx, u)
	if err != nil {
		return domainuser.User{}, err
	}

	if s.auditor != nil {
		s.auditor.Record(ctx, auditusecase.Entry{
			TenantID:   updated.TenantID,
			EntityType: domainaudit.EntityUser,
			EntityID:   updated.ID,
			Action:     domainaudit.ActionRoleChange,
			Changes: []domainaudit.Change{
				{
					FieldChanged: "role",
					OldValue:     string(oldRole),
					NewValue:     string(targetRole),
				},
			},
		})
	}

	return updated, nil
}
