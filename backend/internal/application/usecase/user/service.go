package user

import (
	"context"
	"errors"
	"strings"
	"time"
	"unicode"

	portauth "ps/internal/application/ports/auth"
	userport "ps/internal/application/ports/user"
	auditusecase "ps/internal/application/usecase/auditlog"
	domainaudit "ps/internal/domain/auditlog"
	domainuser "ps/internal/domain/user"
)

const (
	MinPasswordLen = 8
	MaxPasswordLen = 72
	MinNameLen     = 2
	MaxNameLen     = 100
)

var (
	ErrUserNotFound           = errors.New("user not found")
	ErrInvalidInput           = errors.New("invalid input")
	ErrInvalidCurrentPassword = errors.New("invalid current password")
	ErrWeakPassword           = errors.New("weak password")
)

type Service struct {
	users   userport.Repository
	hasher  portauth.PasswordHasher
	auditor *auditusecase.Service
	now     func() time.Time
}

type ProfileOutput struct {
	User domainuser.User `json:"user"`
}

func NewService(users userport.Repository, cars interface{}, hasher portauth.PasswordHasher, auditor ...*auditusecase.Service) *Service {
	var a *auditusecase.Service
	if len(auditor) > 0 {
		a = auditor[0]
	}
	return &Service{
		users:   users,
		hasher:  hasher,
		auditor: a,
		now:     time.Now,
	}
}

func (s *Service) WithAuditor(auditor *auditusecase.Service) *Service {
	s.auditor = auditor
	return s
}

func isValidName(name string) bool {
	if len(name) < MinNameLen || len(name) > MaxNameLen {
		return false
	}
	for _, r := range name {
		if unicode.IsControl(r) {
			return false
		}
	}
	return true
}

func (s *Service) GetProfile(ctx context.Context, userID string) (ProfileOutput, error) {
	user, err := s.users.FindByID(ctx, userID)
	if err != nil {
		return ProfileOutput{}, ErrUserNotFound
	}

	return ProfileOutput{
		User: user,
	}, nil
}

func (s *Service) UpdateProfile(ctx context.Context, userID, name string) (domainuser.User, error) {
	name = strings.TrimSpace(name)
	if !isValidName(name) {
		return domainuser.User{}, ErrInvalidInput
	}

	user, err := s.users.FindByID(ctx, userID)
	if err != nil {
		return domainuser.User{}, ErrUserNotFound
	}

	oldUser := user
	user.Name = name
	user.UpdatedAt = s.now().UTC()

	updated, err := s.users.Update(ctx, user)
	if err != nil {
		return domainuser.User{}, err
	}

	if s.auditor != nil {
		s.auditor.RecordMutation(ctx, updated.TenantID, domainaudit.EntityUser, updated.ID, domainaudit.ActionUpdate, oldUser, updated)
	}

	return updated, nil
}

func (s *Service) UpdatePassword(ctx context.Context, userID, currentPassword, newPassword string) error {
	if len(newPassword) < MinPasswordLen || len(newPassword) > MaxPasswordLen {
		return ErrWeakPassword
	}

	user, err := s.users.FindByID(ctx, userID)
	if err != nil {
		return ErrUserNotFound
	}

	if err := s.hasher.Compare(user.PasswordHash, currentPassword); err != nil {
		return ErrInvalidCurrentPassword
	}

	newHash, err := s.hasher.Hash(newPassword)
	if err != nil {
		return err
	}

	user.PasswordHash = newHash
	user.UpdatedAt = s.now().UTC()

	updated, err := s.users.Update(ctx, user)
	if err != nil {
		return err
	}

	if s.auditor != nil {
		s.auditor.Record(ctx, auditusecase.Entry{
			TenantID:   updated.TenantID,
			EntityType: domainaudit.EntityUser,
			EntityID:   updated.ID,
			Action:     domainaudit.ActionUpdate,
			Changes: []domainaudit.Change{
				{
					FieldChanged: "password",
					OldValue:     nil,
					NewValue:     "[PROTECTED]",
				},
			},
		})
	}

	return nil
}
