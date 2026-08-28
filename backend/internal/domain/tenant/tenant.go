package tenant

import "time"

type Tenant struct {
	Name      string    `json:"name" bson:"_id"`
	CreatedAt time.Time `json:"createdAt" bson:"createdAt"`
}
