package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	portauth "ps/internal/application/ports/auth"
	domainuser "ps/internal/domain/user"
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
func (m *mockTokenService) GenerateRefreshToken(userID string) (string, error) {
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
