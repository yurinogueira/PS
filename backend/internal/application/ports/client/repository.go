package client

import (
	"context"
	"ps/internal/domain/client"
)

type Repository interface {
	Create(ctx context.Context, client *client.SeasonClient) error
	GetByID(ctx context.Context, id, tenantID string) (*client.SeasonClient, error)
	List(ctx context.Context, tenantID string, filter client.ListFilter) (*client.PaginatedClients, error)
	StreamByTenant(ctx context.Context, tenantID, seasonID string, fn func(c *client.SeasonClient) error) error
	Update(ctx context.Context, client *client.SeasonClient) error
	Delete(ctx context.Context, id, tenantID string) error
	DeleteBySeasonID(ctx context.Context, seasonID, tenantID string) error
}
