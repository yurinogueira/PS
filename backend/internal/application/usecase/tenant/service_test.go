package tenant_test

import (
	"context"
	"errors"
	"testing"
	"time"

	clientport "ps/internal/application/ports/client"
	tenantport "ps/internal/application/ports/tenant"
	tenantusecase "ps/internal/application/usecase/tenant"
	domainclient "ps/internal/domain/client"
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

func (m *mockTenantRepo) Update(ctx context.Context, t domaintenant.Tenant) (domaintenant.Tenant, error) {
	if _, ok := m.items[t.Name]; !ok {
		return domaintenant.Tenant{}, tenantport.ErrNotFound
	}
	m.items[t.Name] = t
	return t, nil
}

type mockClientRepo struct {
	countsBySeason map[string]int64
	maxPerSeason   int64
}

func newMockClientRepo() *mockClientRepo {
	return &mockClientRepo{countsBySeason: make(map[string]int64)}
}

func (m *mockClientRepo) Create(ctx context.Context, c *domainclient.SeasonClient) error { return nil }
func (m *mockClientRepo) GetByID(ctx context.Context, id, tenantID string) (*domainclient.SeasonClient, error) {
	return nil, nil
}
func (m *mockClientRepo) List(ctx context.Context, tenantID string, filter domainclient.ListFilter) (*domainclient.PaginatedClients, error) {
	return nil, nil
}
func (m *mockClientRepo) StreamByTenant(ctx context.Context, tenantID, seasonID string, fn func(c *domainclient.SeasonClient) error) error {
	return nil
}
func (m *mockClientRepo) Update(ctx context.Context, c *domainclient.SeasonClient) error { return nil }
func (m *mockClientRepo) Delete(ctx context.Context, id, tenantID string) error          { return nil }
func (m *mockClientRepo) DeleteBySeasonID(ctx context.Context, seasonID, tenantID string) error {
	return nil
}
func (m *mockClientRepo) CountBySeason(ctx context.Context, tenantID, seasonID string) (int64, error) {
	return m.countsBySeason[tenantID+":"+seasonID], nil
}
func (m *mockClientRepo) MaxClientsPerSeason(ctx context.Context, tenantID string) (int64, error) {
	return m.maxPerSeason, nil
}

var _ clientport.Repository = (*mockClientRepo)(nil)

func TestTenantService(t *testing.T) {
	repo := newMockTenantRepo()
	clientRepo := newMockClientRepo()
	svc := tenantusecase.NewService(repo, clientRepo)
	ctx := context.Background()

	// 1. Invalid names
	invalidNames := []string{"", "   ", "invalid name with space", "invalid@name", "org/name"}
	for _, inv := range invalidNames {
		if _, err := svc.Create(ctx, tenantusecase.CreateTenantInput{Name: inv}); err != tenantusecase.ErrInvalidName {
			t.Fatalf("expected ErrInvalidName for %q, got %v", inv, err)
		}
	}

	// 2. Valid creation with default trial
	created, err := svc.Create(ctx, tenantusecase.CreateTenantInput{Name: "acme-corp"})
	if err != nil {
		t.Fatalf("unexpected error creating tenant: %v", err)
	}
	if created.Name != "acme-corp" {
		t.Fatalf("expected acme-corp, got %s", created.Name)
	}
	if created.Plan != domaintenant.PlanFree {
		t.Fatalf("expected free plan, got %s", created.Plan)
	}
	if created.PaymentStatus != domaintenant.PaymentStatusPaid {
		t.Fatalf("expected paid status, got %s", created.PaymentStatus)
	}
	if created.PlanExpiresAt == nil {
		t.Fatal("expected planExpiresAt to be set for free plan")
	}

	// 3. Duplicate creation error
	if _, err := svc.Create(ctx, tenantusecase.CreateTenantInput{Name: "acme-corp"}); err != tenantusecase.ErrAlreadyExists {
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

func TestTenantService_PlanLimitsAndRules(t *testing.T) {
	repo := newMockTenantRepo()
	clientRepo := newMockClientRepo()
	svc := tenantusecase.NewService(repo, clientRepo)
	ctx := context.Background()

	// 1. Create a free tenant
	_, err := svc.Create(ctx, tenantusecase.CreateTenantInput{Name: "active-free"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Should be allowed to do standard actions
	if err := svc.ValidateCanCreateSeason(ctx, "active-free"); err != nil {
		t.Fatalf("active free tenant should be allowed to create season: %v", err)
	}
	if err := svc.ValidateCanExportReport(ctx, "active-free", "season-1"); err != nil {
		t.Fatalf("active free tenant should be allowed to export report: %v", err)
	}
	if err := svc.ValidateCanWriteClients(ctx, "active-free"); err != nil {
		t.Fatalf("active free tenant should be allowed to write clients: %v", err)
	}

	// 2. Expired Trial Tenant
	past := time.Now().UTC().Add(-24 * time.Hour)
	_, _ = repo.Create(ctx, domaintenant.Tenant{
		Name:          "expired-trial",
		Plan:          domaintenant.PlanFree,
		PaymentStatus: domaintenant.PaymentStatusPaid,
		PlanExpiresAt: &past,
		CreatedAt:     time.Now().UTC().Add(-15 * 24 * time.Hour),
	})

	if err := svc.ValidateCanCreateSeason(ctx, "expired-trial"); !errors.Is(err, domaintenant.ErrTrialExpired) {
		t.Fatalf("expected ErrTrialExpired, got %v", err)
	}
	if err := svc.ValidateCanExportReport(ctx, "expired-trial", "season-1"); !errors.Is(err, domaintenant.ErrTrialExpired) {
		t.Fatalf("expected ErrTrialExpired, got %v", err)
	}
	if err := svc.ValidateCanWriteClients(ctx, "expired-trial"); !errors.Is(err, domaintenant.ErrTrialExpired) {
		t.Fatalf("expected ErrTrialExpired, got %v", err)
	}
	if err := svc.ValidateCanWriteEntities(ctx, "expired-trial"); !errors.Is(err, domaintenant.ErrTrialExpired) {
		t.Fatalf("expected ErrTrialExpired, got %v", err)
	}

	// Check status DTO
	statusExpired, err := svc.GetTenantStatus(ctx, "expired-trial")
	if err != nil {
		t.Fatalf("failed to get tenant status: %v", err)
	}
	if !statusExpired.IsTrialExpired {
		t.Fatal("expected IsTrialExpired to be true")
	}

	// 3. Unpaid Tenant
	_, _ = repo.Create(ctx, domaintenant.Tenant{
		Name:          "unpaid-org",
		Plan:          domaintenant.PlanStandard,
		PaymentStatus: domaintenant.PaymentStatusUnpaid,
		CreatedAt:     time.Now().UTC(),
	})

	if err := svc.ValidateCanCreateSeason(ctx, "unpaid-org"); !errors.Is(err, domaintenant.ErrPaymentUnpaid) {
		t.Fatalf("expected ErrPaymentUnpaid, got %v", err)
	}
	if err := svc.ValidateCanExportReport(ctx, "unpaid-org", "season-1"); !errors.Is(err, domaintenant.ErrPaymentUnpaid) {
		t.Fatalf("expected ErrPaymentUnpaid, got %v", err)
	}
	if err := svc.ValidateCanWriteClients(ctx, "unpaid-org"); !errors.Is(err, domaintenant.ErrPaymentUnpaid) {
		t.Fatalf("expected ErrPaymentUnpaid, got %v", err)
	}
	if err := svc.ValidateCanWriteEntities(ctx, "unpaid-org"); !errors.Is(err, domaintenant.ErrPaymentUnpaid) {
		t.Fatalf("expected ErrPaymentUnpaid, got %v", err)
	}

	// 4. Standard Plan with >= 300 clients
	_, _ = repo.Create(ctx, domaintenant.Tenant{
		Name:          "limit-exceeded-org",
		Plan:          domaintenant.PlanStandard,
		PaymentStatus: domaintenant.PaymentStatusPaid,
		CreatedAt:     time.Now().UTC(),
	})
	clientRepo.maxPerSeason = 300
	clientRepo.countsBySeason["limit-exceeded-org:season-1"] = 300

	// Should block season creation and report exports
	if err := svc.ValidateCanCreateSeason(ctx, "limit-exceeded-org"); !errors.Is(err, domaintenant.ErrLimitExceeded) {
		t.Fatalf("expected ErrLimitExceeded on create season, got %v", err)
	}
	if err := svc.ValidateCanExportReport(ctx, "limit-exceeded-org", "season-1"); !errors.Is(err, domaintenant.ErrLimitExceeded) {
		t.Fatalf("expected ErrLimitExceeded on export report, got %v", err)
	}
	// Should NOT block writing entities or writing clients
	if err := svc.ValidateCanWriteEntities(ctx, "limit-exceeded-org"); err != nil {
		t.Fatalf("ValidateCanWriteEntities should not be blocked by 300 client limit: %v", err)
	}
	if err := svc.ValidateCanWriteClients(ctx, "limit-exceeded-org"); err != nil {
		t.Fatalf("ValidateCanWriteClients should not be blocked by 300 client limit: %v", err)
	}

	// 5. Update plan to standard, then free
	updatedStandard, err := svc.UpdatePlan(ctx, "active-free", domaintenant.PlanStandard)
	if err != nil {
		t.Fatalf("failed to update plan to standard: %v", err)
	}
	if updatedStandard.Plan != domaintenant.PlanStandard || updatedStandard.PlanExpiresAt != nil {
		t.Fatal("expected standard plan with nil PlanExpiresAt")
	}

	updatedFree, err := svc.UpdatePlan(ctx, "active-free", domaintenant.PlanFree)
	if err != nil {
		t.Fatalf("failed to update plan to free: %v", err)
	}
	if updatedFree.Plan != domaintenant.PlanFree || updatedFree.PlanExpiresAt == nil {
		t.Fatal("expected free plan with new 14-day trial")
	}

	// 6. Update payment status
	updatedPaid, err := svc.UpdatePaymentStatus(ctx, "unpaid-org", domaintenant.PaymentStatusPaid)
	if err != nil {
		t.Fatalf("failed to update payment status: %v", err)
	}
	if updatedPaid.PaymentStatus != domaintenant.PaymentStatusPaid {
		t.Fatalf("expected paid status, got %s", updatedPaid.PaymentStatus)
	}
}
