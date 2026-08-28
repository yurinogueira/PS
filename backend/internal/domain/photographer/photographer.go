package photographer

import "time"

type Photographer struct {
	ID        string    `json:"id" bson:"_id,omitempty"`
	TenantID  string    `json:"tenant_id" bson:"tenant_id"`
	Name      string    `json:"name" bson:"name"`
	CreatedAt time.Time `json:"created_at" bson:"created_at"`
	UpdatedAt time.Time `json:"updated_at" bson:"updated_at"`
}
