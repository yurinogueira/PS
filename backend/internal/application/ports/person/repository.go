package person

import (
	"context"
	"ps/internal/domain/person"
)

type Repository interface {
	Create(ctx context.Context, person *person.Person) error
	GetByID(ctx context.Context, id string) (*person.Person, error)
	List(ctx context.Context) ([]*person.Person, error)
	Update(ctx context.Context, person *person.Person) error
	Delete(ctx context.Context, id string) error
}
