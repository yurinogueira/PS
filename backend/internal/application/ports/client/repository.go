package client

import (
	"context"
	"ps/internal/domain/client"
)

type Repository interface {
	Create(ctx context.Context, client *client.SeasonClient) error
	GetByID(ctx context.Context, id string) (*client.SeasonClient, error)
	List(ctx context.Context) ([]*client.SeasonClient, error)
	Update(ctx context.Context, client *client.SeasonClient) error
	Delete(ctx context.Context, id string) error
}
