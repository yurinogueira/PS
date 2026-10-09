package auth_test

import (
	"context"
	"testing"
	"time"

	authusecase "ps/internal/application/usecase/auth"
	domainuser "ps/internal/domain/user"
	jwtinfra "ps/internal/infrastructure/auth/jwt"
	usermemory "ps/internal/infrastructure/user/memory"
)

type dummyHasher struct{}

func (d *dummyHasher) Hash(password string) (string, error) {
	return "hash-" + password, nil
}

func (d *dummyHasher) Compare(hashedPassword, password string) error {
	if hashedPassword == "hash-"+password {
		return nil
	}
	return authusecase.ErrInvalidCredentials
}

func TestAuthService_TokenVersionInvalidation(t *testing.T) {
	ctx := context.Background()
	userRepo := usermemory.NewRepository()
	hasher := &dummyHasher{}
	jwtProvider := jwtinfra.NewProvider("access-secret-32-bytes-long-super!!", "refresh-secret-32-bytes-long-super!")
	svc := authusecase.NewService(userRepo, hasher, jwtProvider, nil)

	// Create user with tokenVersion = 1
	user, err := userRepo.Create(ctx, domainuser.User{
		Name:         "Alice",
		Email:        "alice@test.com",
		Role:         domainuser.RoleAdmin,
		SuperAdmin:   true,
		TokenVersion: 1,
	})
	if err != nil {
		t.Fatalf("failed to create user: %v", err)
	}

	// Generate initial token pair (TokenVersion: 1)
	pair1, err := jwtProvider.GeneratePair(user)
	if err != nil {
		t.Fatalf("failed to generate pair: %v", err)
	}

	// 1. Me should succeed with pair1.AccessToken
	meUser, err := svc.Me(ctx, pair1.AccessToken)
	if err != nil {
		t.Fatalf("expected Me to succeed, got %v", err)
	}
	if meUser.ID != user.ID {
		t.Fatalf("expected user %s, got %s", user.ID, meUser.ID)
	}

	// 2. Refresh should succeed with pair1.RefreshToken
	refreshOut, err := svc.Refresh(ctx, pair1.RefreshToken)
	if err != nil {
		t.Fatalf("expected Refresh to succeed, got %v", err)
	}
	if refreshOut.User.ID != user.ID {
		t.Fatalf("expected user %s, got %s", user.ID, refreshOut.User.ID)
	}

	// 3. User's role is updated or session revoked: TokenVersion increments to 2
	user.TokenVersion = 2
	user.UpdatedAt = time.Now().UTC()
	_, err = userRepo.Update(ctx, user)
	if err != nil {
		t.Fatalf("failed to update user: %v", err)
	}

	// 4. Old access token (tver 1) must be rejected by Me
	_, err = svc.Me(ctx, pair1.AccessToken)
	if err != authusecase.ErrInvalidToken {
		t.Fatalf("expected ErrInvalidToken for stale access token, got %v", err)
	}

	// 5. Old refresh token (tver 1) must be rejected by Refresh
	_, err = svc.Refresh(ctx, pair1.RefreshToken)
	if err != authusecase.ErrInvalidToken {
		t.Fatalf("expected ErrInvalidToken for stale refresh token, got %v", err)
	}

	// 6. New token pair (tver 2) should succeed
	pair2, err := jwtProvider.GeneratePair(user)
	if err != nil {
		t.Fatalf("failed to generate new pair: %v", err)
	}

	meUser2, err := svc.Me(ctx, pair2.AccessToken)
	if err != nil {
		t.Fatalf("expected Me with new token to succeed, got %v", err)
	}
	if meUser2.ID != user.ID {
		t.Fatalf("expected user %s, got %s", user.ID, meUser2.ID)
	}
}
