package admin_test

import (
	"context"
	"testing"
	"time"

	adminusecase "ps/internal/application/usecase/admin"
	domaintenant "ps/internal/domain/tenant"
	domainuser "ps/internal/domain/user"
	usermemory "ps/internal/infrastructure/user/memory"
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
		return domaintenant.Tenant{}, adminusecase.ErrTenantNotFound
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

func (m *mockTenantRepo) Update(ctx context.Context, t domaintenant.Tenant) (domaintenant.Tenant, error) {
	if _, ok := m.items[t.Name]; !ok {
		return domaintenant.Tenant{}, adminusecase.ErrTenantNotFound
	}
	m.items[t.Name] = t
	return t, nil
}

func TestAdminService(t *testing.T) {
	userRepo := usermemory.NewRepository()
	tenantRepo := newMockTenantRepo()
	svc := adminusecase.NewService(userRepo, tenantRepo)
	ctx := context.Background()

	// 1. Create a tenant in repo
	_, err := tenantRepo.Create(ctx, domaintenant.Tenant{Name: "org-alpha", CreatedAt: time.Now().UTC()})
	if err != nil {
		t.Fatalf("unexpected error creating tenant: %v", err)
	}

	// 2. Create users
	u1, err := userRepo.Create(ctx, domainuser.User{
		Name:          "User One",
		Email:         "one@test.com",
		EmailVerified: true,
	})
	if err != nil {
		t.Fatalf("unexpected error creating user 1: %v", err)
	}

	u2, err := userRepo.Create(ctx, domainuser.User{
		Name:          "User Two",
		Email:         "two@test.com",
		EmailVerified: false,
		SuperAdmin:    true,
	})
	if err != nil {
		t.Fatalf("unexpected error creating user 2: %v", err)
	}

	// 3. ListUsers
	users, err := svc.ListUsers(ctx)
	if err != nil {
		t.Fatalf("unexpected error listing users: %v", err)
	}
	if len(users) != 2 {
		t.Fatalf("expected 2 users, got %d", len(users))
	}

	// 4. Assign non-existent tenant error
	if _, err := svc.AssignTenant(ctx, u1.ID, "non-existent-tenant"); err != adminusecase.ErrTenantNotFound {
		t.Fatalf("expected ErrTenantNotFound, got %v", err)
	}

	// 5. Assign non-existent user error
	if _, err := svc.AssignTenant(ctx, "non-existent-user", "org-alpha"); err != adminusecase.ErrUserNotFound {
		t.Fatalf("expected ErrUserNotFound, got %v", err)
	}

	// 6. Valid assignment
	updated, err := svc.AssignTenant(ctx, u1.ID, "org-alpha")
	if err != nil {
		t.Fatalf("unexpected error assigning tenant: %v", err)
	}
	if updated.TenantID != "org-alpha" {
		t.Fatalf("expected tenant org-alpha, got %s", updated.TenantID)
	}

	// Check persistence
	refetched, err := userRepo.FindByID(ctx, u1.ID)
	if err != nil || refetched.TenantID != "org-alpha" {
		t.Fatalf("expected persisted tenantID org-alpha, got %v (err: %v)", refetched, err)
	}

	// 7. Unassign tenant (empty string)
	updated, err = svc.AssignTenant(ctx, u1.ID, "")
	if err != nil {
		t.Fatalf("unexpected error unassigning tenant: %v", err)
	}
	if updated.TenantID != "" {
		t.Fatalf("expected empty tenantID, got %s", updated.TenantID)
	}
	_ = u2
}
