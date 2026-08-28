package photographer_test

import (
	"context"
	"errors"
	"testing"

	"ps/internal/application/usecase/photographer"
	domain "ps/internal/domain/photographer"
)

type mockRepo struct {
	items map[string]*domain.Photographer
}

func newMockRepo() *mockRepo {
	return &mockRepo{items: make(map[string]*domain.Photographer)}
}

func (m *mockRepo) Create(ctx context.Context, p *domain.Photographer) error {
	if p.ID == "" {
		p.ID = "photo-1"
	}
	m.items[p.ID] = p
	return nil
}

func (m *mockRepo) GetByID(ctx context.Context, id, tenantID string) (*domain.Photographer, error) {
	p, ok := m.items[id]
	if !ok || p.TenantID != tenantID {
		return nil, errors.New("not found")
	}
	return p, nil
}

func (m *mockRepo) List(ctx context.Context, tenantID string) ([]*domain.Photographer, error) {
	var res []*domain.Photographer
	for _, p := range m.items {
		if p.TenantID == tenantID {
			res = append(res, p)
		}
	}
	return res, nil
}

func (m *mockRepo) Update(ctx context.Context, p *domain.Photographer) error {
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

func TestPhotographerService(t *testing.T) {
	repo := newMockRepo()
	svc := photographer.NewService(repo)
	ctx := context.Background()
	tenantID := "tenant-abc"

	// 1. Create
	p := &domain.Photographer{Name: "Carlos Fotógrafo"}
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
	if found.Name != "Carlos Fotógrafo" {
		t.Fatalf("expected Carlos Fotógrafo, got %s", found.Name)
	}

	// Multi-tenant check: other tenant cannot get
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
	p.Name = "Carlos Silva"
	if err := svc.Update(ctx, p, tenantID); err != nil {
		t.Fatalf("unexpected error on Update: %v", err)
	}
	updated, err := svc.GetByID(ctx, p.ID, tenantID)
	if err != nil || updated.Name != "Carlos Silva" {
		t.Fatalf("expected updated name Carlos Silva, got %v", updated)
	}

	// 5. Delete
	if err := svc.Delete(ctx, p.ID, tenantID); err != nil {
		t.Fatalf("unexpected error on Delete: %v", err)
	}
	if _, err := svc.GetByID(ctx, p.ID, tenantID); err == nil {
		t.Fatalf("expected error after delete, got nil")
	}
}
