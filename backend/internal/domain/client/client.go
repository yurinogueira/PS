package client

import (
	"time"
)

type SeasonClient struct {
	ID        string    `json:"id" bson:"_id,omitempty"`
	TenantID  string    `json:"tenant_id" bson:"tenant_id"`
	PersonID  string    `json:"person_id" bson:"person_id"`
	SeasonID  string    `json:"season_id" bson:"season_id"`
	Dogs      []Dog     `json:"dogs" bson:"dogs"`
	CreatedAt time.Time `json:"created_at" bson:"created_at"`
	UpdatedAt time.Time `json:"updated_at" bson:"updated_at"`
}

type Dog struct {
	Breed           string   `json:"breed" bson:"breed"`
	Judge           string   `json:"judge" bson:"judge"`
	Judges          []string `json:"judges" bson:"judges"`
	IsOwner         *bool    `json:"is_owner" bson:"is_owner"`
	CompetitionsWon int      `json:"competitions_won" bson:"competitions_won"`
	WonCompetitions []string `json:"won_competitions" bson:"won_competitions"`
	Photos          []Photo  `json:"photos" bson:"photos"`
}

type Photo struct {
	FileNumber     string     `json:"file_number" bson:"file_number"`
	PhotographerID string     `json:"photographer_id" bson:"photographer_id"`
	PaymentMethod  string     `json:"payment_method" bson:"payment_method"` // Pix, Cartão de Crédito, Cartão de Débito, Dinheiro, Não pago
	AmountPaid     *float64   `json:"amount_paid" bson:"amount_paid"`
	Judges         []string   `json:"judges,omitempty" bson:"judges,omitempty"`
	CreatedAt      *time.Time `json:"created_at,omitempty" bson:"created_at,omitempty"`
}

type ListFilter struct {
	SeasonID string `json:"season_id"`
	Search   string `json:"search"`
	Page     int    `json:"page"`
	Limit    int    `json:"limit"`
}

type PaginatedClients struct {
	Data  []*SeasonClient `json:"data"`
	Total int64           `json:"total"`
	Page  int             `json:"page"`
	Limit int             `json:"limit"`
}
