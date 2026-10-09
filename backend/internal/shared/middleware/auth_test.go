package middleware_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	portauth "ps/internal/application/ports/auth"
	domainuser "ps/internal/domain/user"
	usermemory "ps/internal/infrastructure/user/memory"
	"ps/internal/shared/middleware"
)

type mockTokenService struct {
	claims portauth.TokenClaims
	err    error
}

func (m *mockTokenService) GeneratePair(user domainuser.User) (portauth.TokenPair, error) {
	return portauth.TokenPair{}, nil
}
func (m *mockTokenService) GenerateAccessToken(user domainuser.User) (string, error) {
	return "", nil
}
func (m *mockTokenService) GenerateRefreshToken(userID string, tokenVersion ...int) (string, error) {
	return "", nil
}
func (m *mockTokenService) ParseAccessToken(token string) (portauth.TokenClaims, error) {
	return m.claims, m.err
}
func (m *mockTokenService) ParseRefreshToken(token string) (portauth.TokenClaims, error) {
	return m.claims, m.err
}

func TestRequireSuperAdmin(t *testing.T) {
	dummyHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	// 1. When user is superadmin
	tokenSvcAdmin := &mockTokenService{
		claims: portauth.TokenClaims{UserID: "u1", SuperAdmin: true},
	}
	chainAdmin := middleware.Auth(tokenSvcAdmin)(middleware.RequireSuperAdmin()(dummyHandler))

	req := httptest.NewRequest("GET", "/admin", nil)
	req.AddCookie(&http.Cookie{Name: "ps_access_token", Value: "valid-token"})
	rec := httptest.NewRecorder()
	chainAdmin.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for superadmin, got %d", rec.Code)
	}

	// 2. When user is NOT superadmin
	tokenSvcNormal := &mockTokenService{
		claims: portauth.TokenClaims{UserID: "u2", SuperAdmin: false},
	}
	chainNormal := middleware.Auth(tokenSvcNormal)(middleware.RequireSuperAdmin()(dummyHandler))

	req2 := httptest.NewRequest("GET", "/admin", nil)
	req2.AddCookie(&http.Cookie{Name: "ps_access_token", Value: "valid-token"})
	rec2 := httptest.NewRecorder()
	chainNormal.ServeHTTP(rec2, req2)

	if rec2.Code != http.StatusForbidden {
		t.Fatalf("expected 403 Forbidden for non-superadmin, got %d", rec2.Code)
	}
}

func TestRequireAdminOrManager(t *testing.T) {
	dummyHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	// 1. Admin allowed
	tokenAdmin := &mockTokenService{
		claims: portauth.TokenClaims{UserID: "u1", Role: "admin"},
	}
	chain := middleware.Auth(tokenAdmin)(middleware.RequireAdminOrManager()(dummyHandler))
	req := httptest.NewRequest("GET", "/admin/logs", nil)
	req.AddCookie(&http.Cookie{Name: "ps_access_token", Value: "valid"})
	rec := httptest.NewRecorder()
	chain.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 for admin, got %d", rec.Code)
	}

	// 2. Manager allowed
	tokenManager := &mockTokenService{
		claims: portauth.TokenClaims{UserID: "u2", Role: "manager"},
	}
	chain = middleware.Auth(tokenManager)(middleware.RequireAdminOrManager()(dummyHandler))
	req = httptest.NewRequest("GET", "/admin/logs", nil)
	req.AddCookie(&http.Cookie{Name: "ps_access_token", Value: "valid"})
	rec = httptest.NewRecorder()
	chain.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 for manager, got %d", rec.Code)
	}

	// 3. Regular user forbidden
	tokenUser := &mockTokenService{
		claims: portauth.TokenClaims{UserID: "u3", Role: "user"},
	}
	chain = middleware.Auth(tokenUser)(middleware.RequireAdminOrManager()(dummyHandler))
	req = httptest.NewRequest("GET", "/admin/logs", nil)
	req.AddCookie(&http.Cookie{Name: "ps_access_token", Value: "valid"})
	rec = httptest.NewRecorder()
	chain.ServeHTTP(rec, req)
	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for regular user, got %d", rec.Code)
	}
}

func TestRequireAdmin_DatabaseAndTokenVersionValidation(t *testing.T) {
	dummyHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	userRepo := usermemory.NewRepository()
	ctx := context.Background()

	// Create user in DB as admin with tokenVersion 2
	user, err := userRepo.Create(ctx, domainuser.User{
		Name:         "Admin Alice",
		Email:        "alice@admin.com",
		Role:         domainuser.RoleAdmin,
		SuperAdmin:   true,
		TokenVersion: 2,
	})
	if err != nil {
		t.Fatalf("failed to create user: %v", err)
	}

	// 1. Valid token matching DB role and tokenVersion
	validTokenSvc := &mockTokenService{
		claims: portauth.TokenClaims{
			UserID:       user.ID,
			Role:         "admin",
			SuperAdmin:   true,
			TokenVersion: 2,
		},
	}
	chainValid := middleware.Auth(validTokenSvc)(middleware.RequireAdmin(userRepo)(dummyHandler))
	reqValid := httptest.NewRequest("GET", "/admin/users", nil)
	reqValid.AddCookie(&http.Cookie{Name: "ps_access_token", Value: "valid"})
	recValid := httptest.NewRecorder()
	chainValid.ServeHTTP(recValid, reqValid)
	if recValid.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for valid admin, got %d", recValid.Code)
	}

	// 2. Token version is stale (tokenVersion 1 < DB tokenVersion 2) -> 401 Unauthorized
	staleTokenSvc := &mockTokenService{
		claims: portauth.TokenClaims{
			UserID:       user.ID,
			Role:         "admin",
			SuperAdmin:   true,
			TokenVersion: 1,
		},
	}
	chainStale := middleware.Auth(staleTokenSvc)(middleware.RequireAdmin(userRepo)(dummyHandler))
	reqStale := httptest.NewRequest("GET", "/admin/users", nil)
	reqStale.AddCookie(&http.Cookie{Name: "ps_access_token", Value: "stale"})
	recStale := httptest.NewRecorder()
	chainStale.ServeHTTP(recStale, reqStale)
	if recStale.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 Unauthorized for stale token version, got %d", recStale.Code)
	}

	// 3. User demoted in DB to "user" (even if token claims say "admin") -> 403 Forbidden
	user.Role = domainuser.RoleUser
	user.SuperAdmin = false
	user.TokenVersion = 3
	_, err = userRepo.Update(ctx, user)
	if err != nil {
		t.Fatalf("failed to update user: %v", err)
	}

	demotedTokenSvc := &mockTokenService{
		claims: portauth.TokenClaims{
			UserID:       user.ID,
			Role:         "admin",
			SuperAdmin:   true,
			TokenVersion: 3,
		},
	}
	chainDemoted := middleware.Auth(demotedTokenSvc)(middleware.RequireAdmin(userRepo)(dummyHandler))
	reqDemoted := httptest.NewRequest("GET", "/admin/users", nil)
	reqDemoted.AddCookie(&http.Cookie{Name: "ps_access_token", Value: "demoted"})
	recDemoted := httptest.NewRecorder()
	chainDemoted.ServeHTTP(recDemoted, reqDemoted)
	if recDemoted.Code != http.StatusForbidden {
		t.Fatalf("expected 403 Forbidden for demoted admin, got %d", recDemoted.Code)
	}
}
