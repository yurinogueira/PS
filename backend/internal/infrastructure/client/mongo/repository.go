package mongo

import (
	"context"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"ps/internal/application/ports/client"
	domain "ps/internal/domain/client"
)

type repository struct {
	collection *mongo.Collection
}

func NewRepository(db *mongo.Database) client.Repository {
	return &repository{collection: db.Collection("season_clients")}
}

func (r *repository) Create(ctx context.Context, client *domain.SeasonClient) error {
	client.ID = bson.NewObjectID().Hex()
	_, err := r.collection.InsertOne(ctx, client)
	return err
}

func (r *repository) GetByID(ctx context.Context, id, tenantID string) (*domain.SeasonClient, error) {
	var client domain.SeasonClient
	err := r.collection.FindOne(ctx, bson.M{"_id": id, "tenant_id": tenantID}).Decode(&client)
	if err != nil {
		return nil, err
	}
	return &client, nil
}

func (r *repository) List(ctx context.Context, tenantID string) ([]*domain.SeasonClient, error) {
	cursor, err := r.collection.Find(ctx, bson.M{"tenant_id": tenantID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	list := make([]*domain.SeasonClient, 0)
	if err = cursor.All(ctx, &list); err != nil {
		return nil, err
	}
	return list, nil
}

func (r *repository) Update(ctx context.Context, client *domain.SeasonClient) error {
	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": client.ID, "tenant_id": client.TenantID}, bson.M{"$set": client})
	return err
}

func (r *repository) Delete(ctx context.Context, id, tenantID string) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id, "tenant_id": tenantID})
	return err
}
