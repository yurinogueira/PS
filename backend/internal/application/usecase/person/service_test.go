package person_test

import (
	"context"
	"errors"
	"testing"

	"ps/internal/application/usecase/person"
	domain "ps/internal/domain/person"
)

type mockRepo struct {
	items map[string]*domain.Person
}

func newMockRepo() *mockRepo {
	return &mockRepo{items: make(map[string]*domain.Person)}
}

func (m *mockRepo) Create(ctx context.Context, p *domain.Person) error {
	if p.ID == "" {
		p.ID = "person-1"
	}
	m.items[p.ID] = p
	return nil
}

func (m *mockRepo) GetByID(ctx context.Context, id, tenantID string) (*domain.Person, error) {
	p, ok := m.items[id]
	if !ok || p.TenantID != tenantID {
		return nil, errors.New("not found")
	}
	return p, nil
}

func (m *mockRepo) List(ctx context.Context, tenantID string) ([]*domain.Person, error) {
	var res []*domain.Person
	for _, p := range m.items {
		if p.TenantID == tenantID {
			res = append(res, p)
		}
	}
	return res, nil
}

func (m *mockRepo) Update(ctx context.Context, p *domain.Person) error {
	existing, ok := m.items[p.ID]
	if !ok || existing.TenantID != p.TenantID {
		return errors.New("not found")
	}
	m.items[p.ID] = p
	return nil
}

func (m *mockRepo) Delete(ctx context.Context, id, tenantID string) error {
	existing, ok := m.items[id]
	if !ok || existing.TenantID != tenantID {
		return errors.New("not found")
	}
	delete(m.items, id)
	return nil
}

func TestPersonService(t *testing.T) {
	repo := newMockRepo()
	svc := person.NewService(repo)
	ctx := context.Background()
	tenantID := "tenant-p"

	// 1. Create
	p := &domain.Person{
		Name:             "Maria Joana",
		Email:            "maria@test.com",
		AlternativeEmail: "maria.alt@test.com",
		Phone:            "11999999999",
	}
	if err := svc.Create(ctx, p, tenantID); err != nil {
		t.Fatalf("unexpected error on Create: %v", err)
	}
	if p.TenantID != tenantID {
		t.Fatalf("expected tenantID %s, got %s", tenantID, p.TenantID)
	}

	// 2. GetByID
	found, err := svc.GetByID(ctx, p.ID, tenantID)
	if err != nil {
		t.Fatalf("unexpected error on GetByID: %v", err)
	}
	if found.Name != "Maria Joana" {
		t.Fatalf("expected Maria Joana, got %s", found.Name)
	}

	// Multi-tenant check
	if _, err := svc.GetByID(ctx, p.ID, "tenant-other"); err == nil {
		t.Fatalf("expected error accessing across tenant, got nil")
	}

	// 3. List
	list, err := svc.List(ctx, tenantID)
	if err != nil {
		t.Fatalf("unexpected error on List: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("expected 1 item, got %d", len(list))
	}

	// 4. Update
	p.Name = "Maria Joana da Silva"
	p.Phone = "11988888888"
	if err := svc.Update(ctx, p, tenantID); err != nil {
		t.Fatalf("unexpected error on Update: %v", err)
	}
	updated, err := svc.GetByID(ctx, p.ID, tenantID)
	if err != nil || updated.Name != "Maria Joana da Silva" || updated.Phone != "11988888888" {
		t.Fatalf("expected updated person, got %v", updated)
	}

	// 5. Delete
	if err := svc.Delete(ctx, p.ID, tenantID); err != nil {
		t.Fatalf("unexpected error on Delete: %v", err)
	}
	if _, err := svc.GetByID(ctx, p.ID, tenantID); err == nil {
		t.Fatalf("expected error after delete, got nil")
	}
}
