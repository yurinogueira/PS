package user

import (
	"context"
	"errors"
	"strings"
	"time"
	"unicode"

	portauth "ps/internal/application/ports/auth"
	userport "ps/internal/application/ports/user"
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
	users  userport.Repository
	hasher portauth.PasswordHasher
	now    func() time.Time
}

type ProfileOutput struct {
	User domainuser.User `json:"user"`
}

func NewService(users userport.Repository, cars interface{}, hasher portauth.PasswordHasher) *Service {
	return &Service{
		users:  users,
		hasher: hasher,
		now:    time.Now,
	}
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

	user.Name = name
	user.UpdatedAt = s.now().UTC()

	return s.users.Update(ctx, user)
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

	_, err = s.users.Update(ctx, user)
	return err
}
