package handlers_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	auditport "ps/internal/application/ports/auditlog"
	auditusecase "ps/internal/application/usecase/auditlog"
	domainaudit "ps/internal/domain/auditlog"
	"ps/internal/interfaces/rest/handlers"
	"ps/internal/shared/middleware"
)

type mockAuditRepo struct {
	capturedFilter auditport.Filter
}

func (m *mockAuditRepo) Create(ctx context.Context, log *domainaudit.AuditLog) error {
	return nil
}

func (m *mockAuditRepo) List(ctx context.Context, filter auditport.Filter) (auditport.PaginatedResult, error) {
	m.capturedFilter = filter
	return auditport.PaginatedResult{
		Items:      []domainaudit.AuditLog{},
		Total:      0,
		Page:       filter.Page,
		Limit:      filter.Limit,
		TotalPages: 0,
	}, nil
}

func TestAuditLogHandler_List_Params(t *testing.T) {
	tests := []struct {
		name               string
		url                string
		expectedEntity     domainaudit.EntityType
		expectedAction     domainaudit.Action
		expectedUserID     string
		expectedTenantID   string
		expectedHasStartDt bool
		expectedHasEndDt   bool
	}{
		{
			name:               "snake_case query parameters",
			url:                "/api/v1/admin/logs?page=1&limit=10&entity_type=season&action=CREATE&user_id=usr-123&tenant_id=tenant-abc&start_date=2026-09-01T00:00:00Z&end_date=2026-09-02T00:00:00Z",
			expectedEntity:     domainaudit.EntitySeason,
			expectedAction:     domainaudit.ActionCreate,
			expectedUserID:     "usr-123",
			expectedTenantID:   "tenant-abc",
			expectedHasStartDt: true,
			expectedHasEndDt:   true,
		},
		{
			name:               "camelCase query parameters",
			url:                "/api/v1/admin/logs?page=2&limit=25&entityType=client&action=UPDATE&userId=usr-456&tenantId=tenant-xyz&startDate=2026-09-03T00:00:00Z&endDate=2026-09-04T00:00:00Z",
			expectedEntity:     domainaudit.EntityClient,
			expectedAction:     domainaudit.ActionUpdate,
			expectedUserID:     "usr-456",
			expectedTenantID:   "tenant-xyz",
			expectedHasStartDt: true,
			expectedHasEndDt:   true,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			repo := &mockAuditRepo{}
			svc := auditusecase.NewService(repo)
			handler := handlers.NewAuditLogHandler(svc)

			req := httptest.NewRequest(http.MethodGet, tc.url, nil)
			ctx := context.WithValue(req.Context(), middleware.UserRoleKey, "admin")
			req = req.WithContext(ctx)

			rr := httptest.NewRecorder()
			handler.List(rr, req)

			if rr.Code != http.StatusOK {
				t.Fatalf("expected status 200, got %d", rr.Code)
			}

			if repo.capturedFilter.EntityType != tc.expectedEntity {
				t.Errorf("expected entity type %s, got %s", tc.expectedEntity, repo.capturedFilter.EntityType)
			}
			if repo.capturedFilter.Action != tc.expectedAction {
				t.Errorf("expected action %s, got %s", tc.expectedAction, repo.capturedFilter.Action)
			}
			if repo.capturedFilter.UserID != tc.expectedUserID {
				t.Errorf("expected user id %s, got %s", tc.expectedUserID, repo.capturedFilter.UserID)
			}
			if repo.capturedFilter.TenantID != tc.expectedTenantID {
				t.Errorf("expected tenant id %s, got %s", tc.expectedTenantID, repo.capturedFilter.TenantID)
			}
			if tc.expectedHasStartDt && repo.capturedFilter.StartDate == nil {
				t.Errorf("expected StartDate to be parsed, got nil")
			}
			if tc.expectedHasEndDt && repo.capturedFilter.EndDate == nil {
				t.Errorf("expected EndDate to be parsed, got nil")
			}
		})
	}

	t.Run("manager is scoped to their tenant", func(t *testing.T) {
		repo := &mockAuditRepo{}
		svc := auditusecase.NewService(repo)
		handler := handlers.NewAuditLogHandler(svc)

		req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/logs?entityType=client", nil)
		ctx := context.WithValue(req.Context(), middleware.UserRoleKey, "manager")
		ctx = context.WithValue(ctx, middleware.TenantIDKey, "manager-tenant-123")
		req = req.WithContext(ctx)

		rr := httptest.NewRecorder()
		handler.List(rr, req)

		if rr.Code != http.StatusOK {
			t.Fatalf("expected status 200, got %d", rr.Code)
		}

		if repo.capturedFilter.TenantID != "manager-tenant-123" {
			t.Errorf("expected tenantID manager-tenant-123, got %s", repo.capturedFilter.TenantID)
		}
		if repo.capturedFilter.EntityType != domainaudit.EntityClient {
			t.Errorf("expected entity client, got %s", repo.capturedFilter.EntityType)
		}
	})
}
