package auditlog

import (
	"context"
	"testing"

	auditport "ps/internal/application/ports/auditlog"
	domainaudit "ps/internal/domain/auditlog"
	"ps/internal/shared/authctx"
)

type mockRepository struct {
	created []domainaudit.AuditLog
	listFn  func(ctx context.Context, filter auditport.Filter) (auditport.PaginatedResult, error)
}

func (m *mockRepository) Create(ctx context.Context, log *domainaudit.AuditLog) error {
	m.created = append(m.created, *log)
	return nil
}

func (m *mockRepository) List(ctx context.Context, filter auditport.Filter) (auditport.PaginatedResult, error) {
	if m.listFn != nil {
		return m.listFn(ctx, filter)
	}
	return auditport.PaginatedResult{
		Items:      m.created,
		Total:      int64(len(m.created)),
		Page:       1,
		Limit:      20,
		TotalPages: 1,
	}, nil
}

type sampleEntity struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	PasswordHash string `json:"-"`
	SecretToken  string `json:"secretToken"`
	Price        int    `json:"price"`
}

func TestDiff_Create(t *testing.T) {
	ent := sampleEntity{
		ID:           "e1",
		Name:         "Novo Nome",
		PasswordHash: "secret-hash",
		SecretToken:  "token-123",
		Price:        100,
	}

	changes := Diff(nil, ent)
	if len(changes) == 0 {
		t.Fatalf("expected changes on create, got none")
	}

	for _, c := range changes {
		if c.FieldChanged == "PasswordHash" || c.FieldChanged == "secretToken" {
			t.Errorf("sensitive field %s should have been omitted", c.FieldChanged)
		}
		if c.OldValue != nil {
			t.Errorf("expected OldValue to be nil on create, got %v", c.OldValue)
		}
	}
}

func TestDiff_Delete(t *testing.T) {
	ent := sampleEntity{
		ID:    "e1",
		Name:  "Excluido",
		Price: 50,
	}

	changes := Diff(ent, nil)
	if len(changes) == 0 {
		t.Fatalf("expected changes on delete, got none")
	}

	for _, c := range changes {
		if c.NewValue != nil {
			t.Errorf("expected NewValue to be nil on delete, got %v", c.NewValue)
		}
	}
}

func TestDiff_Update(t *testing.T) {
	oldEnt := sampleEntity{
		ID:    "e1",
		Name:  "Nome Antigo",
		Price: 50,
	}
	newEnt := sampleEntity{
		ID:    "e1",
		Name:  "Nome Novo",
		Price: 50, // unchaged
	}

	changes := Diff(oldEnt, newEnt)
	if len(changes) != 1 {
		t.Fatalf("expected exactly 1 changed field, got %d", len(changes))
	}
	if changes[0].FieldChanged != "name" {
		t.Errorf("expected field 'name', got %s", changes[0].FieldChanged)
	}
	if changes[0].OldValue != "Nome Antigo" || changes[0].NewValue != "Nome Novo" {
		t.Errorf("unexpected diff values: %+v", changes[0])
	}
}

func TestRecordSync_ContextExtraction(t *testing.T) {
	repo := &mockRepository{}
	svc := NewService(repo)

	ctx := authctx.WithUser(context.Background(), "user-123", "admin@ps.com", "tenant-xyz", "admin")

	err := svc.RecordSync(ctx, Entry{
		EntityType: domainaudit.EntitySeason,
		EntityID:   "season-1",
		Action:     domainaudit.ActionCreate,
		Changes: []domainaudit.Change{
			{FieldChanged: "title", OldValue: nil, NewValue: "Temporada 2026"},
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(repo.created) != 1 {
		t.Fatalf("expected 1 audit log, got %d", len(repo.created))
	}

	log := repo.created[0]
	if log.UserID != "user-123" {
		t.Errorf("expected UserID user-123, got %s", log.UserID)
	}
	if log.UserEmail != "admin@ps.com" {
		t.Errorf("expected UserEmail admin@ps.com, got %s", log.UserEmail)
	}
	if log.TenantID != "tenant-xyz" {
		t.Errorf("expected TenantID tenant-xyz, got %s", log.TenantID)
	}
	if log.Action != domainaudit.ActionCreate {
		t.Errorf("expected Action CREATE, got %s", log.Action)
	}
}
