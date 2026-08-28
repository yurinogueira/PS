package person

import "time"

type Person struct {
	ID               string    `json:"id" bson:"_id,omitempty"`
	Name             string    `json:"name" bson:"name"`
	Email            string    `json:"email" bson:"email"`
	AlternativeEmail string    `json:"alternative_email" bson:"alternative_email"`
	Phone            string    `json:"phone" bson:"phone"`
	CreatedAt        time.Time `json:"created_at" bson:"created_at"`
	UpdatedAt        time.Time `json:"updated_at" bson:"updated_at"`
}
