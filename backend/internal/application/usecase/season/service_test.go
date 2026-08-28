package season_test

import (
	"context"
	"errors"
	"testing"

	"ps/internal/application/usecase/season"
	domain "ps/internal/domain/season"
)

type mockRepo struct {
	items map[string]*domain.Season
}

func newMockRepo() *mockRepo {
	return &mockRepo{items: make(map[string]*domain.Season)}
}

func (m *mockRepo) Create(ctx context.Context, s *domain.Season) error {
	if s.ID == "" {
		s.ID = "season-1"
	}
	m.items[s.ID] = s
	return nil
}

func (m *mockRepo) GetByID(ctx context.Context, id, tenantID string) (*domain.Season, error) {
	s, ok := m.items[id]
	if !ok || s.TenantID != tenantID {
		return nil, errors.New("not found")
	}
	return s, nil
}

func (m *mockRepo) List(ctx context.Context, tenantID string) ([]*domain.Season, error) {
	var res []*domain.Season
	for _, s := range m.items {
		if s.TenantID == tenantID {
			res = append(res, s)
		}
	}
	return res, nil
}

func (m *mockRepo) Update(ctx context.Context, s *domain.Season) error {
	existing, ok := m.items[s.ID]
	if !ok || existing.TenantID != s.TenantID {
		return errors.New("not found")
	}
	m.items[s.ID] = s
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

func TestSeasonService(t *testing.T) {
	repo := newMockRepo()
	svc := season.NewService(repo)
	ctx := context.Background()
	tenantID := "tenant-xyz"

	// 1. Create
	s := &domain.Season{Name: "Temporada 2026", PhotographerIDs: []string{"photo-1", "photo-2"}}
	if err := svc.Create(ctx, s, tenantID); err != nil {
		t.Fatalf("unexpected error on Create: %v", err)
	}
	if s.TenantID != tenantID {
		t.Fatalf("expected tenantID %s, got %s", tenantID, s.TenantID)
	}

	// 2. GetByID
	found, err := svc.GetByID(ctx, s.ID, tenantID)
	if err != nil {
		t.Fatalf("unexpected error on GetByID: %v", err)
	}
	if found.Name != "Temporada 2026" {
		t.Fatalf("expected Temporada 2026, got %s", found.Name)
	}
	if len(found.PhotographerIDs) != 2 {
		t.Fatalf("expected 2 photographer IDs, got %d", len(found.PhotographerIDs))
	}

	// Multi-tenant check: other tenant cannot get
	if _, err := svc.GetByID(ctx, s.ID, "tenant-other"); err == nil {
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
	s.Name = "Temporada 2026/2027"
	s.PhotographerIDs = []string{"photo-1"}
	if err := svc.Update(ctx, s, tenantID); err != nil {
		t.Fatalf("unexpected error on Update: %v", err)
	}
	updated, err := svc.GetByID(ctx, s.ID, tenantID)
	if err != nil || updated.Name != "Temporada 2026/2027" || len(updated.PhotographerIDs) != 1 {
		t.Fatalf("expected updated season, got %v", updated)
	}

	// 5. Delete
	if err := svc.Delete(ctx, s.ID, tenantID); err != nil {
		t.Fatalf("unexpected error on Delete: %v", err)
	}
	if _, err := svc.GetByID(ctx, s.ID, tenantID); err == nil {
		t.Fatalf("expected error after delete, got nil")
	}
}
