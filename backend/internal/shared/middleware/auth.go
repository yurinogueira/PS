package middleware

import (
	"context"
	"net/http"
	"strings"

	portauth "ps/internal/application/ports/auth"
	"ps/internal/shared/authctx"
	"ps/internal/shared/httpx"
)

type contextKey string

const (
	UserIDKey     contextKey = "user_id"
	TenantIDKey   contextKey = "tenant_id"
	SuperAdminKey contextKey = "super_admin"
	UserEmailKey  contextKey = "user_email"
	UserRoleKey   contextKey = "user_role"
)

func GetTenantID(ctx context.Context) string {
	if val, ok := ctx.Value(TenantIDKey).(string); ok && val != "" {
		return val
	}
	return authctx.GetTenantID(ctx)
}

func GetUserID(ctx context.Context) string {
	if val, ok := ctx.Value(UserIDKey).(string); ok && val != "" {
		return val
	}
	return authctx.GetUserID(ctx)
}

func GetUserEmail(ctx context.Context) string {
	if val, ok := ctx.Value(UserEmailKey).(string); ok && val != "" {
		return val
	}
	return authctx.GetUserEmail(ctx)
}

func GetUserRole(ctx context.Context) string {
	if val, ok := ctx.Value(UserRoleKey).(string); ok && val != "" {
		return val
	}
	role := authctx.GetUserRole(ctx)
	if role != "" {
		return role
	}
	if IsSuperAdmin(ctx) {
		return "admin"
	}
	return "user"
}

func IsSuperAdmin(ctx context.Context) bool {
	if val, ok := ctx.Value(SuperAdminKey).(bool); ok {
		return val
	}
	return false
}

func IsAdmin(ctx context.Context) bool {
	return IsSuperAdmin(ctx) || GetUserRole(ctx) == "admin"
}

func IsManager(ctx context.Context) bool {
	return GetUserRole(ctx) == "manager"
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

			role := claims.Role
			if role == "" {
				if claims.SuperAdmin {
					role = "admin"
				} else {
					role = "user"
				}
			}
			isAdmin := claims.SuperAdmin || role == "admin"

			ctx := context.WithValue(r.Context(), UserIDKey, claims.UserID)
			ctx = context.WithValue(ctx, TenantIDKey, claims.TenantID)
			ctx = context.WithValue(ctx, SuperAdminKey, isAdmin)
			ctx = context.WithValue(ctx, UserEmailKey, claims.Email)
			ctx = context.WithValue(ctx, UserRoleKey, role)

			// Also populate shared authctx
			ctx = authctx.WithUser(ctx, claims.UserID, claims.Email, claims.TenantID, role)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func RequireTenant() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tenantID := GetTenantID(r.Context())
			if strings.TrimSpace(tenantID) == "" {
				httpx.Error(w, http.StatusForbidden, "Tenant is required. Pending administrator approval.", nil)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func RequireSuperAdmin() func(http.Handler) http.Handler {
	return RequireAdmin()
}

func RequireAdmin() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !IsAdmin(r.Context()) {
				httpx.Error(w, http.StatusForbidden, "Forbidden: administrator access required", nil)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func RequireAdminOrManager() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !IsAdmin(r.Context()) && !IsManager(r.Context()) {
				httpx.Error(w, http.StatusForbidden, "Forbidden: administrator or manager access required", nil)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
