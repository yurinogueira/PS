package middleware

import (
	"context"
	"net/http"
	"strings"

	portauth "ps/internal/application/ports/auth"
	"ps/internal/shared/httpx"
)

type contextKey string

const (
	UserIDKey   contextKey = "user_id"
	TenantIDKey contextKey = "tenant_id"
)

func GetTenantID(ctx context.Context) string {
	if val, ok := ctx.Value(TenantIDKey).(string); ok {
		return val
	}
	return ""
}

func Auth(tokenService portauth.TokenService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := ""
			if cookie, err := r.Cookie("ps_access_token"); err == nil && cookie.Value != "" {
				token = cookie.Value
			} else if bearer := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer "); bearer != "" && bearer != r.Header.Get("Authorization") {
				token = bearer
			}

			if token == "" {
				httpx.Error(w, http.StatusUnauthorized, "Unauthorized", nil)
				return
			}

			claims, err := tokenService.ParseAccessToken(token)
			if err != nil {
				httpx.Error(w, http.StatusUnauthorized, "Invalid or expired token", nil)
				return
			}

			ctx := context.WithValue(r.Context(), UserIDKey, claims.UserID)
			ctx = context.WithValue(ctx, TenantIDKey, claims.TenantID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func RequireTenant() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tenantID, ok := r.Context().Value(TenantIDKey).(string)
			if !ok || strings.TrimSpace(tenantID) == "" {
				httpx.Error(w, http.StatusForbidden, "Tenant is required. Pending administrator approval.", nil)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
