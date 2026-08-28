package season

import "time"

type Season struct {
	ID              string    `json:"id" bson:"_id,omitempty"`
	Name            string    `json:"name" bson:"name"`
	PhotographerIDs []string  `json:"photographer_ids" bson:"photographer_ids"`
	CreatedAt       time.Time `json:"created_at" bson:"created_at"`
	UpdatedAt       time.Time `json:"updated_at" bson:"updated_at"`
}
