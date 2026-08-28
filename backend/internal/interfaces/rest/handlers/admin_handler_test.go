package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	adminusecase "ps/internal/application/usecase/admin"
	tenantusecase "ps/internal/application/usecase/tenant"
	domaintenant "ps/internal/domain/tenant"
	domainuser "ps/internal/domain/user"
	usermemory "ps/internal/infrastructure/user/memory"
	"ps/internal/interfaces/rest/handlers"
)

type mockTenantRepo struct {
	items map[string]domaintenant.Tenant
}

func newMockTenantRepo() *mockTenantRepo {
	return &mockTenantRepo{items: make(map[string]domaintenant.Tenant)}
}

func (m *mockTenantRepo) Create(ctx context.Context, t domaintenant.Tenant) (domaintenant.Tenant, error) {
	m.items[t.Name] = t
	return t, nil
}

func (m *mockTenantRepo) FindByName(ctx context.Context, name string) (domaintenant.Tenant, error) {
	t, ok := m.items[name]
	if !ok {
		return domaintenant.Tenant{}, tenantusecase.ErrNotFound
	}
	return t, nil
}

func (m *mockTenantRepo) List(ctx context.Context) ([]domaintenant.Tenant, error) {
	res := make([]domaintenant.Tenant, 0, len(m.items))
	for _, t := range m.items {
		res = append(res, t)
	}
	return res, nil
}

func TestAdminHandler_Tenants(t *testing.T) {
	tenantRepo := newMockTenantRepo()
	userRepo := usermemory.NewRepository()
	tenantSvc := tenantusecase.NewService(tenantRepo)
	adminSvc := adminusecase.NewService(userRepo, tenantRepo)
	handler := handlers.NewAdminHandler(tenantSvc, adminSvc)

	// 1. Create Tenant
	body, _ := json.Marshal(map[string]string{"name": "alpha-tenant"})
	req := httptest.NewRequest("POST", "/api/v1/admin/tenants", bytes.NewReader(body))
	rec := httptest.NewRecorder()
	handler.CreateTenant(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created, got %d: %s", rec.Code, rec.Body.String())
	}

	// 2. List Tenants
	reqList := httptest.NewRequest("GET", "/api/v1/admin/tenants", nil)
	recList := httptest.NewRecorder()
	handler.ListTenants(recList, reqList)

	if recList.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d", recList.Code)
	}
}

func TestAdminHandler_Users(t *testing.T) {
	tenantRepo := newMockTenantRepo()
	userRepo := usermemory.NewRepository()
	tenantSvc := tenantusecase.NewService(tenantRepo)
	adminSvc := adminusecase.NewService(userRepo, tenantRepo)
	handler := handlers.NewAdminHandler(tenantSvc, adminSvc)

	_, _ = tenantRepo.Create(context.Background(), domaintenant.Tenant{Name: "alpha-tenant", CreatedAt: time.Now().UTC()})
	u, _ := userRepo.Create(context.Background(), domainuser.User{Name: "Jane Doe", Email: "jane@test.com"})

	// 1. List Users
	reqList := httptest.NewRequest("GET", "/api/v1/admin/users", nil)
	recList := httptest.NewRecorder()
	handler.ListUsers(recList, reqList)

	if recList.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d", recList.Code)
	}

	// 2. Assign Tenant
	assignBody, _ := json.Marshal(map[string]string{"tenantId": "alpha-tenant"})
	reqAssign := httptest.NewRequest("PUT", "/api/v1/admin/users/"+u.ID+"/tenant", bytes.NewReader(assignBody))
	reqAssign.SetPathValue("id", u.ID)
	recAssign := httptest.NewRecorder()
	handler.AssignTenant(recAssign, reqAssign)

	if recAssign.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d: %s", recAssign.Code, recAssign.Body.String())
	}
}
