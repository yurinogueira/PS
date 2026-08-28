package client_test

import (
	"context"
	"errors"
	"testing"

	"ps/internal/application/usecase/client"
	domain "ps/internal/domain/client"
)

type mockRepo struct {
	items map[string]*domain.SeasonClient
}

func newMockRepo() *mockRepo {
	return &mockRepo{items: make(map[string]*domain.SeasonClient)}
}

func (m *mockRepo) Create(ctx context.Context, c *domain.SeasonClient) error {
	if c.ID == "" {
		c.ID = "client-1"
	}
	m.items[c.ID] = c
	return nil
}

func (m *mockRepo) GetByID(ctx context.Context, id, tenantID string) (*domain.SeasonClient, error) {
	c, ok := m.items[id]
	if !ok || c.TenantID != tenantID {
		return nil, errors.New("not found")
	}
	return c, nil
}

func (m *mockRepo) List(ctx context.Context, tenantID string) ([]*domain.SeasonClient, error) {
	var res []*domain.SeasonClient
	for _, c := range m.items {
		if c.TenantID == tenantID {
			res = append(res, c)
		}
	}
	return res, nil
}

func (m *mockRepo) Update(ctx context.Context, c *domain.SeasonClient) error {
	existing, ok := m.items[c.ID]
	if !ok || existing.TenantID != c.TenantID {
		return errors.New("not found")
	}
	m.items[c.ID] = c
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

func TestClientService(t *testing.T) {
	repo := newMockRepo()
	svc := client.NewService(repo)
	ctx := context.Background()
	tenantID := "tenant-client"

	// 1. Create
	c := &domain.SeasonClient{
		PersonID: "person-123",
		SeasonID: "season-123",
		Dogs: []domain.Dog{
			{
				Breed:           "Border Collie",
				Judge:           "Juiz 1",
				CompetitionsWon: 2,
				Photos: []domain.Photo{
					{
						FileNumber:     "DSC_0001",
						PhotographerID: "photo-1",
						PaymentMethod:  "Pix",
					},
				},
			},
		},
	}
	if err := svc.Create(ctx, c, tenantID); err != nil {
		t.Fatalf("unexpected error on Create: %v", err)
	}
	if c.TenantID != tenantID {
		t.Fatalf("expected tenantID %s, got %s", tenantID, c.TenantID)
	}

	// 2. GetByID
	found, err := svc.GetByID(ctx, c.ID, tenantID)
	if err != nil {
		t.Fatalf("unexpected error on GetByID: %v", err)
	}
	if found.PersonID != "person-123" || len(found.Dogs) != 1 {
		t.Fatalf("expected 1 dog and person-123, got %v", found)
	}

	// Multi-tenant check
	if _, err := svc.GetByID(ctx, c.ID, "tenant-other"); err == nil {
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
	c.Dogs[0].Breed = "Golden Retriever"
	if err := svc.Update(ctx, c, tenantID); err != nil {
		t.Fatalf("unexpected error on Update: %v", err)
	}
	updated, err := svc.GetByID(ctx, c.ID, tenantID)
	if err != nil || updated.Dogs[0].Breed != "Golden Retriever" {
		t.Fatalf("expected updated dog breed Golden Retriever, got %v", updated)
	}

	// 5. Delete
	if err := svc.Delete(ctx, c.ID, tenantID); err != nil {
		t.Fatalf("unexpected error on Delete: %v", err)
	}
	if _, err := svc.GetByID(ctx, c.ID, tenantID); err == nil {
		t.Fatalf("expected error after delete, got nil")
	}
}
