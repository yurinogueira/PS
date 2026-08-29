package client_test

import (
	"context"
	"errors"
	"testing"

	"ps/internal/application/usecase/client"
	domain "ps/internal/domain/client"
	persondomain "ps/internal/domain/person"
	photographerdomain "ps/internal/domain/photographer"
	seasondomain "ps/internal/domain/season"
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

func (m *mockRepo) List(ctx context.Context, tenantID string, filter domain.ListFilter) (*domain.PaginatedClients, error) {
	var res []*domain.SeasonClient
	for _, c := range m.items {
		if c.TenantID == tenantID {
			if filter.SeasonID != "" && c.SeasonID != filter.SeasonID {
				continue
			}
			res = append(res, c)
		}
	}
	total := int64(len(res))
	page := filter.Page
	if page <= 0 {
		page = 1
	}
	limit := filter.Limit
	if limit <= 0 {
		limit = 10
	}

	return &domain.PaginatedClients{
		Data:  res,
		Total: total,
		Page:  page,
		Limit: limit,
	}, nil
}

func (m *mockRepo) StreamByTenant(ctx context.Context, tenantID string, fn func(c *domain.SeasonClient) error) error {
	for _, c := range m.items {
		if c.TenantID == tenantID {
			if err := fn(c); err != nil {
				return err
			}
		}
	}
	return nil
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

type mockPersonRepo struct {
	items map[string]*persondomain.Person
}

func newMockPersonRepo() *mockPersonRepo {
	return &mockPersonRepo{items: make(map[string]*persondomain.Person)}
}

func (m *mockPersonRepo) Create(ctx context.Context, p *persondomain.Person) error {
	m.items[p.ID] = p
	return nil
}

func (m *mockPersonRepo) GetByID(ctx context.Context, id, tenantID string) (*persondomain.Person, error) {
	p, ok := m.items[id]
	if !ok || p.TenantID != tenantID {
		return nil, errors.New("not found")
	}
	return p, nil
}

func (m *mockPersonRepo) List(ctx context.Context, tenantID string) ([]*persondomain.Person, error) {
	var res []*persondomain.Person
	for _, p := range m.items {
		if p.TenantID == tenantID {
			res = append(res, p)
		}
	}
	return res, nil
}

func (m *mockPersonRepo) Update(ctx context.Context, p *persondomain.Person) error {
	m.items[p.ID] = p
	return nil
}

func (m *mockPersonRepo) Delete(ctx context.Context, id, tenantID string) error {
	delete(m.items, id)
	return nil
}

type mockSeasonRepo struct {
	items map[string]*seasondomain.Season
}

func newMockSeasonRepo() *mockSeasonRepo {
	return &mockSeasonRepo{items: make(map[string]*seasondomain.Season)}
}

func (m *mockSeasonRepo) Create(ctx context.Context, s *seasondomain.Season) error {
	m.items[s.ID] = s
	return nil
}

func (m *mockSeasonRepo) GetByID(ctx context.Context, id, tenantID string) (*seasondomain.Season, error) {
	s, ok := m.items[id]
	if !ok || s.TenantID != tenantID {
		return nil, errors.New("not found")
	}
	return s, nil
}

func (m *mockSeasonRepo) List(ctx context.Context, tenantID string) ([]*seasondomain.Season, error) {
	var res []*seasondomain.Season
	for _, s := range m.items {
		if s.TenantID == tenantID {
			res = append(res, s)
		}
	}
	return res, nil
}

func (m *mockSeasonRepo) Update(ctx context.Context, s *seasondomain.Season) error {
	m.items[s.ID] = s
	return nil
}

func (m *mockSeasonRepo) Delete(ctx context.Context, id, tenantID string) error {
	delete(m.items, id)
	return nil
}

type mockPhotographerRepo struct {
	items map[string]*photographerdomain.Photographer
}

func newMockPhotographerRepo() *mockPhotographerRepo {
	return &mockPhotographerRepo{items: make(map[string]*photographerdomain.Photographer)}
}

func (m *mockPhotographerRepo) Create(ctx context.Context, p *photographerdomain.Photographer) error {
	m.items[p.ID] = p
	return nil
}

func (m *mockPhotographerRepo) GetByID(ctx context.Context, id, tenantID string) (*photographerdomain.Photographer, error) {
	p, ok := m.items[id]
	if !ok || p.TenantID != tenantID {
		return nil, errors.New("not found")
	}
	return p, nil
}

func (m *mockPhotographerRepo) List(ctx context.Context, tenantID string) ([]*photographerdomain.Photographer, error) {
	var res []*photographerdomain.Photographer
	for _, p := range m.items {
		if p.TenantID == tenantID {
			res = append(res, p)
		}
	}
	return res, nil
}

func (m *mockPhotographerRepo) Update(ctx context.Context, p *photographerdomain.Photographer) error {
	m.items[p.ID] = p
	return nil
}

func (m *mockPhotographerRepo) Delete(ctx context.Context, id, tenantID string) error {
	delete(m.items, id)
	return nil
}

func TestClientService(t *testing.T) {
	repo := newMockRepo()
	personRepo := newMockPersonRepo()
	seasonRepo := newMockSeasonRepo()
	photogRepo := newMockPhotographerRepo()

	svc := client.NewService(repo, personRepo, seasonRepo, photogRepo)
	ctx := context.Background()
	tenantID := "tenant-client"

	// Seed valid foreign records for tenantID
	personRepo.items["person-123"] = &persondomain.Person{ID: "person-123", TenantID: tenantID, Name: "John Doe"}
	seasonRepo.items["season-123"] = &seasondomain.Season{ID: "season-123", TenantID: tenantID, Name: "Season 2026"}
	photogRepo.items["photo-1"] = &photographerdomain.Photographer{ID: "photo-1", TenantID: tenantID, Name: "Photographer 1"}

	// 1. Create with valid references
	c := &domain.SeasonClient{
		PersonID: "person-123",
		SeasonID: "season-123",
		Dogs: []domain.Dog{
			{
				Breed:           "Border Collie",
				Judge:           "Juiz 1",
				CompetitionsWon: 2,
				WonCompetitions: []string{"Best in Show 2026", "National Championship"},
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
	if found.PersonID != "person-123" || len(found.Dogs) != 1 || len(found.Dogs[0].WonCompetitions) != 2 {
		t.Fatalf("expected 1 dog, person-123, and 2 won competitions, got %v", found)
	}

	// Multi-tenant check on client itself
	if _, err := svc.GetByID(ctx, c.ID, "tenant-other"); err == nil {
		t.Fatalf("expected error accessing across tenant, got nil")
	}

	// 3. List
	paginated, err := svc.List(ctx, tenantID, domain.ListFilter{SeasonID: "season-123"})
	if err != nil {
		t.Fatalf("unexpected error on List: %v", err)
	}
	if paginated.Total != 1 || len(paginated.Data) != 1 {
		t.Fatalf("expected 1 item in paginated response, got total %d, data len %d", paginated.Total, len(paginated.Data))
	}
	if paginated.Page != 1 || paginated.Limit != 10 {
		t.Fatalf("expected default page 1 and limit 10, got page %d, limit %d", paginated.Page, paginated.Limit)
	}

	// 3.1 List with other season
	otherSeason, err := svc.List(ctx, tenantID, domain.ListFilter{SeasonID: "other-season"})
	if err != nil {
		t.Fatalf("unexpected error on List other season: %v", err)
	}
	if otherSeason.Total != 0 || len(otherSeason.Data) != 0 {
		t.Fatalf("expected 0 items for other season, got %d", otherSeason.Total)
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

func TestClientService_CrossTenantValidation(t *testing.T) {
	repo := newMockRepo()
	personRepo := newMockPersonRepo()
	seasonRepo := newMockSeasonRepo()
	photogRepo := newMockPhotographerRepo()

	svc := client.NewService(repo, personRepo, seasonRepo, photogRepo)
	ctx := context.Background()

	tenantA := "tenant-A"
	tenantB := "tenant-B"

	// Populate tenantA entities
	personRepo.items["person-A"] = &persondomain.Person{ID: "person-A", TenantID: tenantA, Name: "Person A"}
	seasonRepo.items["season-A"] = &seasondomain.Season{ID: "season-A", TenantID: tenantA, Name: "Season A"}
	photogRepo.items["photo-A"] = &photographerdomain.Photographer{ID: "photo-A", TenantID: tenantA, Name: "Photo A"}

	// Populate tenantB entities
	personRepo.items["person-B"] = &persondomain.Person{ID: "person-B", TenantID: tenantB, Name: "Person B"}
	seasonRepo.items["season-B"] = &seasondomain.Season{ID: "season-B", TenantID: tenantB, Name: "Season B"}
	photogRepo.items["photo-B"] = &photographerdomain.Photographer{ID: "photo-B", TenantID: tenantB, Name: "Photo B"}

	// 1. Create with alien PersonID
	t.Run("Create - alien PersonID", func(t *testing.T) {
		c := &domain.SeasonClient{
			PersonID: "person-B", // belongs to tenantB
			SeasonID: "season-A",
		}
		err := svc.Create(ctx, c, tenantA)
		if !errors.Is(err, client.ErrPersonNotFound) {
			t.Fatalf("expected ErrPersonNotFound, got %v", err)
		}
	})

	// 2. Create with non-existent PersonID
	t.Run("Create - non-existent PersonID", func(t *testing.T) {
		c := &domain.SeasonClient{
			PersonID: "person-non-existent",
			SeasonID: "season-A",
		}
		err := svc.Create(ctx, c, tenantA)
		if !errors.Is(err, client.ErrPersonNotFound) {
			t.Fatalf("expected ErrPersonNotFound, got %v", err)
		}
	})

	// 3. Create with alien SeasonID
	t.Run("Create - alien SeasonID", func(t *testing.T) {
		c := &domain.SeasonClient{
			PersonID: "person-A",
			SeasonID: "season-B", // belongs to tenantB
		}
		err := svc.Create(ctx, c, tenantA)
		if !errors.Is(err, client.ErrSeasonNotFound) {
			t.Fatalf("expected ErrSeasonNotFound, got %v", err)
		}
	})

	// 4. Create with alien PhotographerID in photos
	t.Run("Create - alien PhotographerID", func(t *testing.T) {
		c := &domain.SeasonClient{
			PersonID: "person-A",
			SeasonID: "season-A",
			Dogs: []domain.Dog{
				{
					Breed: "Poodle",
					Photos: []domain.Photo{
						{FileNumber: "IMG_001", PhotographerID: "photo-B"}, // belongs to tenantB
					},
				},
			},
		}
		err := svc.Create(ctx, c, tenantA)
		if !errors.Is(err, client.ErrPhotographerNotFound) {
			t.Fatalf("expected ErrPhotographerNotFound, got %v", err)
		}
	})

	// 5. Successful Create in tenantA
	validClient := &domain.SeasonClient{
		ID:       "client-A-1",
		PersonID: "person-A",
		SeasonID: "season-A",
		Dogs: []domain.Dog{
			{
				Breed: "Poodle",
				Photos: []domain.Photo{
					{FileNumber: "IMG_001", PhotographerID: "photo-A"},
					{FileNumber: "IMG_002", PhotographerID: ""}, // Empty photographer is valid
				},
			},
		},
	}
	if err := svc.Create(ctx, validClient, tenantA); err != nil {
		t.Fatalf("unexpected error creating valid client: %v", err)
	}

	// 6. Update - client not found or from alien tenant
	t.Run("Update - alien tenant client update", func(t *testing.T) {
		updateAttempt := &domain.SeasonClient{
			ID:       "client-A-1",
			PersonID: "person-B",
			SeasonID: "season-B",
		}
		err := svc.Update(ctx, updateAttempt, tenantB) // tenantB trying to update tenantA's client
		if !errors.Is(err, client.ErrClientNotFound) {
			t.Fatalf("expected ErrClientNotFound, got %v", err)
		}
	})

	// 7. Update - valid client with alien references
	t.Run("Update - alien PersonID", func(t *testing.T) {
		updateAttempt := &domain.SeasonClient{
			ID:       "client-A-1",
			PersonID: "person-B",
			SeasonID: "season-A",
		}
		err := svc.Update(ctx, updateAttempt, tenantA)
		if !errors.Is(err, client.ErrPersonNotFound) {
			t.Fatalf("expected ErrPersonNotFound, got %v", err)
		}
	})

	t.Run("Update - alien SeasonID", func(t *testing.T) {
		updateAttempt := &domain.SeasonClient{
			ID:       "client-A-1",
			PersonID: "person-A",
			SeasonID: "season-B",
		}
		err := svc.Update(ctx, updateAttempt, tenantA)
		if !errors.Is(err, client.ErrSeasonNotFound) {
			t.Fatalf("expected ErrSeasonNotFound, got %v", err)
		}
	})

	t.Run("Update - alien PhotographerID", func(t *testing.T) {
		updateAttempt := &domain.SeasonClient{
			ID:       "client-A-1",
			PersonID: "person-A",
			SeasonID: "season-A",
			Dogs: []domain.Dog{
				{
					Photos: []domain.Photo{
						{FileNumber: "IMG_003", PhotographerID: "photo-B"},
					},
				},
			},
		}
		err := svc.Update(ctx, updateAttempt, tenantA)
		if !errors.Is(err, client.ErrPhotographerNotFound) {
			t.Fatalf("expected ErrPhotographerNotFound, got %v", err)
		}
	})
}
