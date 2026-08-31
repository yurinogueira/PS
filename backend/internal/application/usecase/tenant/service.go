package tenant

import (
	"context"
	"errors"
	"regexp"
	"strings"
	"time"

	clientport "ps/internal/application/ports/client"
	tenantport "ps/internal/application/ports/tenant"
	domaintenant "ps/internal/domain/tenant"
)

var (
	ErrInvalidName          = errors.New("invalid tenant name")
	ErrInvalidPlan          = errors.New("invalid plan: must be 'free' or 'standard'")
	ErrInvalidPaymentStatus = errors.New("invalid payment status: must be 'paid' or 'unpaid'")
	ErrAlreadyExists        = tenantport.ErrAlreadyExists
	ErrNotFound             = tenantport.ErrNotFound
	ErrLimitExceeded        = domaintenant.ErrLimitExceeded
	ErrPaymentUnpaid        = domaintenant.ErrPaymentUnpaid
	ErrTrialExpired         = domaintenant.ErrTrialExpired

	validNameRegex = regexp.MustCompile(`^[a-zA-Z0-9_\-]+$`)
)

type CreateTenantInput struct {
	Name                  string
	Plan                  string
	PaymentStatus         string
	HideOverviewByDefault bool
}

type TenantStatusDTO struct {
	Name                string                      `json:"name"`
	Plan                string                      `json:"plan"`
	PaymentStatus       string                      `json:"paymentStatus"`
	Settings            domaintenant.TenantSettings `json:"settings"`
	PlanStartedAt       *time.Time                  `json:"planStartedAt,omitempty"`
	PlanExpiresAt       *time.Time                  `json:"planExpiresAt,omitempty"`
	IsTrialExpired      bool                        `json:"isTrialExpired"`
	TrialDaysRemaining  int                         `json:"trialDaysRemaining"`
	IsUnpaid            bool                        `json:"isUnpaid"`
	ClientLimitExceeded bool                        `json:"clientLimitExceeded"`
	MaxClientsInSeason  int64                       `json:"maxClientsInSeason"`
	CreatedAt           time.Time                   `json:"createdAt"`
	UpdatedAt           time.Time                   `json:"updatedAt,omitempty"`
}

type Service struct {
	repo       tenantport.Repository
	clientRepo clientport.Repository
}

func NewService(repo tenantport.Repository, clientRepo ...clientport.Repository) *Service {
	var cr clientport.Repository
	if len(clientRepo) > 0 {
		cr = clientRepo[0]
	}
	return &Service{
		repo:       repo,
		clientRepo: cr,
	}
}

func (s *Service) Create(ctx context.Context, input CreateTenantInput) (domaintenant.Tenant, error) {
	cleanName := strings.TrimSpace(input.Name)
	if cleanName == "" || len(cleanName) > 128 || !validNameRegex.MatchString(cleanName) {
		return domaintenant.Tenant{}, ErrInvalidName
	}

	plan := strings.ToLower(strings.TrimSpace(input.Plan))
	if plan == "" {
		plan = domaintenant.PlanFree
	}
	if plan != domaintenant.PlanFree && plan != domaintenant.PlanStandard {
		return domaintenant.Tenant{}, ErrInvalidPlan
	}

	paymentStatus := strings.ToLower(strings.TrimSpace(input.PaymentStatus))
	if paymentStatus == "" {
		paymentStatus = domaintenant.PaymentStatusPaid
	}
	if paymentStatus != domaintenant.PaymentStatusPaid && paymentStatus != domaintenant.PaymentStatusUnpaid {
		return domaintenant.Tenant{}, ErrInvalidPaymentStatus
	}

	// Check if already exists
	if _, err := s.repo.FindByName(ctx, cleanName); err == nil {
		return domaintenant.Tenant{}, ErrAlreadyExists
	}

	now := time.Now().UTC()
	var planStartedAt *time.Time = &now
	var planExpiresAt *time.Time
	if plan == domaintenant.PlanFree {
		exp := now.Add(domaintenant.TrialDurationDays * 24 * time.Hour)
		planExpiresAt = &exp
	}

	t := domaintenant.Tenant{
		Name:          cleanName,
		Plan:          plan,
		PaymentStatus: paymentStatus,
		Settings: domaintenant.TenantSettings{
			HideOverviewByDefault: input.HideOverviewByDefault,
		},
		PlanStartedAt: planStartedAt,
		PlanExpiresAt: planExpiresAt,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	return s.repo.Create(ctx, t)
}

func (s *Service) UpdatePlan(ctx context.Context, name string, plan string) (domaintenant.Tenant, error) {
	cleanName := strings.TrimSpace(name)
	if cleanName == "" {
		return domaintenant.Tenant{}, ErrInvalidName
	}

	cleanPlan := strings.ToLower(strings.TrimSpace(plan))
	if cleanPlan != domaintenant.PlanFree && cleanPlan != domaintenant.PlanStandard {
		return domaintenant.Tenant{}, ErrInvalidPlan
	}

	t, err := s.repo.FindByName(ctx, cleanName)
	if err != nil {
		return domaintenant.Tenant{}, err
	}

	now := time.Now().UTC()
	t.Plan = cleanPlan
	t.UpdatedAt = now

	if cleanPlan == domaintenant.PlanFree {
		// Renovar 14 dias de trial se mudar para free
		t.PlanStartedAt = &now
		exp := now.Add(domaintenant.TrialDurationDays * 24 * time.Hour)
		t.PlanExpiresAt = &exp
	} else if cleanPlan == domaintenant.PlanStandard {
		t.PlanExpiresAt = nil
	}

	return s.repo.Update(ctx, t)
}

func (s *Service) UpdatePaymentStatus(ctx context.Context, name string, status string) (domaintenant.Tenant, error) {
	cleanName := strings.TrimSpace(name)
	if cleanName == "" {
		return domaintenant.Tenant{}, ErrInvalidName
	}

	cleanStatus := strings.ToLower(strings.TrimSpace(status))
	if cleanStatus != domaintenant.PaymentStatusPaid && cleanStatus != domaintenant.PaymentStatusUnpaid {
		return domaintenant.Tenant{}, ErrInvalidPaymentStatus
	}

	t, err := s.repo.FindByName(ctx, cleanName)
	if err != nil {
		return domaintenant.Tenant{}, err
	}

	now := time.Now().UTC()
	t.PaymentStatus = cleanStatus
	t.UpdatedAt = now

	return s.repo.Update(ctx, t)
}

func (s *Service) UpdateSettings(ctx context.Context, name string, settings domaintenant.TenantSettings) (domaintenant.Tenant, error) {
	cleanName := strings.TrimSpace(name)
	if cleanName == "" {
		return domaintenant.Tenant{}, ErrInvalidName
	}

	t, err := s.repo.FindByName(ctx, cleanName)
	if err != nil {
		return domaintenant.Tenant{}, err
	}

	now := time.Now().UTC()
	t.Settings = settings
	t.UpdatedAt = now

	return s.repo.Update(ctx, t)
}

func (s *Service) List(ctx context.Context) ([]domaintenant.Tenant, error) {
	return s.repo.List(ctx)
}

func (s *Service) GetByName(ctx context.Context, name string) (domaintenant.Tenant, error) {
	cleanName := strings.TrimSpace(name)
	if cleanName == "" {
		return domaintenant.Tenant{}, ErrInvalidName
	}
	return s.repo.FindByName(ctx, cleanName)
}

func (s *Service) GetTenantStatus(ctx context.Context, tenantID string) (*TenantStatusDTO, error) {
	t, err := s.repo.FindByName(ctx, tenantID)
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	isTrialExpired := t.IsTrialExpired(now)
	trialDaysRemaining := 0
	if t.Plan == domaintenant.PlanFree && t.PlanExpiresAt != nil {
		diff := t.PlanExpiresAt.Sub(now)
		if diff > 0 {
			trialDaysRemaining = int((diff + 24*time.Hour - 1) / (24 * time.Hour))
		}
	}

	var maxClients int64
	clientLimitExceeded := false
	if s.clientRepo != nil {
		maxClients, _ = s.clientRepo.MaxClientsPerSeason(ctx, tenantID)
		if maxClients >= domaintenant.StandardMaxClients {
			clientLimitExceeded = true
		}
	}

	return &TenantStatusDTO{
		Name:                t.Name,
		Plan:                t.Plan,
		PaymentStatus:       t.PaymentStatus,
		Settings:            t.Settings,
		PlanStartedAt:       t.PlanStartedAt,
		PlanExpiresAt:       t.PlanExpiresAt,
		IsTrialExpired:      isTrialExpired,
		TrialDaysRemaining:  trialDaysRemaining,
		IsUnpaid:            t.IsUnpaid(),
		ClientLimitExceeded: clientLimitExceeded,
		MaxClientsInSeason:  maxClients,
		CreatedAt:           t.CreatedAt,
		UpdatedAt:           t.UpdatedAt,
	}, nil
}

func (s *Service) ValidateCanCreateSeason(ctx context.Context, tenantID string) error {
	t, err := s.repo.FindByName(ctx, tenantID)
	if err != nil {
		return err
	}

	if t.IsUnpaid() {
		return domaintenant.ErrPaymentUnpaid
	}
	if t.IsTrialExpired(time.Now().UTC()) {
		return domaintenant.ErrTrialExpired
	}

	if s.clientRepo != nil {
		maxClients, err := s.clientRepo.MaxClientsPerSeason(ctx, tenantID)
		if err == nil && maxClients >= domaintenant.StandardMaxClients {
			return domaintenant.ErrLimitExceeded
		}
	}

	return nil
}

func (s *Service) ValidateCanExportReport(ctx context.Context, tenantID, seasonID string) error {
	t, err := s.repo.FindByName(ctx, tenantID)
	if err != nil {
		return err
	}

	if t.IsUnpaid() {
		return domaintenant.ErrPaymentUnpaid
	}
	if t.IsTrialExpired(time.Now().UTC()) {
		return domaintenant.ErrTrialExpired
	}

	if s.clientRepo != nil {
		var count int64
		var err error
		if seasonID != "" {
			count, err = s.clientRepo.CountBySeason(ctx, tenantID, seasonID)
		} else {
			count, err = s.clientRepo.MaxClientsPerSeason(ctx, tenantID)
		}
		if err == nil && count >= domaintenant.StandardMaxClients {
			return domaintenant.ErrLimitExceeded
		}
	}

	return nil
}

func (s *Service) ValidateCanWriteClients(ctx context.Context, tenantID string) error {
	t, err := s.repo.FindByName(ctx, tenantID)
	if err != nil {
		return err
	}

	if t.IsUnpaid() {
		return domaintenant.ErrPaymentUnpaid
	}
	if t.IsTrialExpired(time.Now().UTC()) {
		return domaintenant.ErrTrialExpired
	}

	return nil
}

func (s *Service) ValidateCanWriteEntities(ctx context.Context, tenantID string) error {
	t, err := s.repo.FindByName(ctx, tenantID)
	if err != nil {
		return err
	}

	if t.IsUnpaid() {
		return domaintenant.ErrPaymentUnpaid
	}
	if t.IsTrialExpired(time.Now().UTC()) {
		return domaintenant.ErrTrialExpired
	}

	return nil
}
