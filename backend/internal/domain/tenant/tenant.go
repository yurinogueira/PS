package tenant

import (
	"errors"
	"time"
)

const (
	PlanFree     = "free"
	PlanStandard = "standard"

	PaymentStatusPaid   = "paid"
	PaymentStatusUnpaid = "unpaid"

	TrialDurationDays  = 14
	StandardMaxClients = 300
)

var (
	ErrLimitExceeded = errors.New("A sua organização excedeu o limite de clientes cadastrados no plano atual. A criação de novos eventos e a exportação de relatórios estão suspensas. Entre em contato com o suporte para regularizar.")
	ErrPaymentUnpaid = errors.New("Acesso suspenso por pendência de pagamento da assinatura. Entre em contato com o suporte para regularizar.")
	ErrTrialExpired  = errors.New("O período de teste gratuito de 14 dias da sua organização encerrou. A edição de clientes e exportação de relatórios estão bloqueadas. Entre em contato com o suporte para assinar um plano.")
)

type Tenant struct {
	Name          string     `json:"name" bson:"_id"`
	Plan          string     `json:"plan" bson:"plan"`
	PaymentStatus string     `json:"paymentStatus" bson:"paymentStatus"`
	PlanStartedAt *time.Time `json:"planStartedAt,omitempty" bson:"planStartedAt,omitempty"`
	PlanExpiresAt *time.Time `json:"planExpiresAt,omitempty" bson:"planExpiresAt,omitempty"`
	CreatedAt     time.Time  `json:"createdAt" bson:"createdAt"`
	UpdatedAt     time.Time  `json:"updatedAt,omitempty" bson:"updatedAt,omitempty"`
}

func (t Tenant) IsTrialExpired(now time.Time) bool {
	if t.Plan == PlanFree && t.PlanExpiresAt != nil && now.After(*t.PlanExpiresAt) {
		return true
	}
	return false
}

func (t Tenant) IsUnpaid() bool {
	return t.PaymentStatus == PaymentStatusUnpaid
}
