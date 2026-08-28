package tenant_test

import (
	"context"
	"testing"

	tenantport "ps/internal/application/ports/tenant"
	tenantusecase "ps/internal/application/usecase/tenant"
	domaintenant "ps/internal/domain/tenant"
)

type mockTenantRepo struct {
	items map[string]domaintenant.Tenant
}

func newMockTenantRepo() *mockTenantRepo {
	return &mockTenantRepo{items: make(map[string]domaintenant.Tenant)}
}

func (m *mockTenantRepo) Create(ctx context.Context, t domaintenant.Tenant) (domaintenant.Tenant, error) {
	if _, ok := m.items[t.Name]; ok {
		return domaintenant.Tenant{}, tenantport.ErrAlreadyExists
	}
	m.items[t.Name] = t
	return t, nil
}

func (m *mockTenantRepo) FindByName(ctx context.Context, name string) (domaintenant.Tenant, error) {
	t, ok := m.items[name]
	if !ok {
		return domaintenant.Tenant{}, tenantport.ErrNotFound
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

func TestTenantService(t *testing.T) {
	repo := newMockTenantRepo()
	svc := tenantusecase.NewService(repo)
	ctx := context.Background()

	// 1. Invalid names
	invalidNames := []string{"", "   ", "invalid name with space", "invalid@name", "org/name"}
	for _, inv := range invalidNames {
		if _, err := svc.Create(ctx, inv); err != tenantusecase.ErrInvalidName {
			t.Fatalf("expected ErrInvalidName for %q, got %v", inv, err)
		}
	}

	// 2. Valid creation
	created, err := svc.Create(ctx, "acme-corp")
	if err != nil {
		t.Fatalf("unexpected error creating tenant: %v", err)
	}
	if created.Name != "acme-corp" {
		t.Fatalf("expected acme-corp, got %s", created.Name)
	}

	// 3. Duplicate creation error
	if _, err := svc.Create(ctx, "acme-corp"); err != tenantusecase.ErrAlreadyExists {
		t.Fatalf("expected ErrAlreadyExists on duplicate, got %v", err)
	}

	// 4. List
	list, err := svc.List(ctx)
	if err != nil {
		t.Fatalf("unexpected error on List: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("expected 1 tenant in list, got %d", len(list))
	}

	// 5. GetByName
	found, err := svc.GetByName(ctx, "acme-corp")
	if err != nil {
		t.Fatalf("unexpected error on GetByName: %v", err)
	}
	if found.Name != "acme-corp" {
		t.Fatalf("expected acme-corp, got %s", found.Name)
	}

	// 6. GetByName not found
	if _, err := svc.GetByName(ctx, "non-existent"); err != tenantusecase.ErrNotFound {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
}
