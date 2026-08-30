package season_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"ps/internal/application/usecase/season"
	clientdomain "ps/internal/domain/client"
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

type mockClientRepo struct {
	items map[string]*clientdomain.SeasonClient
}

func newMockClientRepo() *mockClientRepo {
	return &mockClientRepo{items: make(map[string]*clientdomain.SeasonClient)}
}

func (m *mockClientRepo) Create(ctx context.Context, c *clientdomain.SeasonClient) error {
	m.items[c.ID] = c
	return nil
}

func (m *mockClientRepo) GetByID(ctx context.Context, id, tenantID string) (*clientdomain.SeasonClient, error) {
	c, ok := m.items[id]
	if !ok || c.TenantID != tenantID {
		return nil, errors.New("not found")
	}
	return c, nil
}

func (m *mockClientRepo) List(ctx context.Context, tenantID string, filter clientdomain.ListFilter) (*clientdomain.PaginatedClients, error) {
	var data []*clientdomain.SeasonClient
	for _, c := range m.items {
		if c.TenantID == tenantID && (filter.SeasonID == "" || c.SeasonID == filter.SeasonID) {
			data = append(data, c)
		}
	}
	return &clientdomain.PaginatedClients{
		Data:  data,
		Total: int64(len(data)),
	}, nil
}

func (m *mockClientRepo) StreamByTenant(ctx context.Context, tenantID, seasonID string, fn func(c *clientdomain.SeasonClient) error) error {
	for _, c := range m.items {
		if c.TenantID == tenantID && (seasonID == "" || c.SeasonID == seasonID) {
			if err := fn(c); err != nil {
				return err
			}
		}
	}
	return nil
}

func (m *mockClientRepo) Update(ctx context.Context, c *clientdomain.SeasonClient) error {
	m.items[c.ID] = c
	return nil
}

func (m *mockClientRepo) Delete(ctx context.Context, id, tenantID string) error {
	delete(m.items, id)
	return nil
}

func (m *mockClientRepo) DeleteBySeasonID(ctx context.Context, seasonID, tenantID string) error {
	for id, c := range m.items {
		if c.TenantID == tenantID && c.SeasonID == seasonID {
			delete(m.items, id)
		}
	}
	return nil
}

func TestSeasonService(t *testing.T) {
	repo := newMockRepo()
	clientRepo := newMockClientRepo()
	svc := season.NewService(repo, clientRepo)
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

	// Add dependent clients for this season, another season, and another tenant
	clientRepo.Create(ctx, &clientdomain.SeasonClient{ID: "client-1", TenantID: tenantID, SeasonID: s.ID})
	clientRepo.Create(ctx, &clientdomain.SeasonClient{ID: "client-2", TenantID: tenantID, SeasonID: s.ID})
	clientRepo.Create(ctx, &clientdomain.SeasonClient{ID: "client-other-season", TenantID: tenantID, SeasonID: "other-season"})
	clientRepo.Create(ctx, &clientdomain.SeasonClient{ID: "client-other-tenant", TenantID: "other-tenant", SeasonID: s.ID})

	// 5. Delete (with cascade in background)
	if err := svc.Delete(ctx, s.ID, tenantID); err != nil {
		t.Fatalf("unexpected error on Delete: %v", err)
	}
	if _, err := svc.GetByID(ctx, s.ID, tenantID); err == nil {
		t.Fatalf("expected error after delete, got nil")
	}

	// Give background goroutine a moment to complete
	time.Sleep(50 * time.Millisecond)

	// Check cascade deletion: client-1 and client-2 must be removed, other clients must remain
	if _, err := clientRepo.GetByID(ctx, "client-1", tenantID); err == nil {
		t.Fatalf("expected client-1 to be cascade deleted")
	}
	if _, err := clientRepo.GetByID(ctx, "client-2", tenantID); err == nil {
		t.Fatalf("expected client-2 to be cascade deleted")
	}
	if _, err := clientRepo.GetByID(ctx, "client-other-season", tenantID); err != nil {
		t.Fatalf("expected client-other-season to remain, got err: %v", err)
	}
	if _, err := clientRepo.GetByID(ctx, "client-other-tenant", "other-tenant"); err != nil {
		t.Fatalf("expected client-other-tenant to remain, got err: %v", err)
	}
}
