package mongo

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"ps/internal/application/ports/client"
	domain "ps/internal/domain/client"
	mongoinfra "ps/internal/infrastructure/database/mongo"
)

type repository struct {
	collection *mongo.Collection
}

func NewRepository(db *mongo.Database) client.Repository {
	return &repository{collection: db.Collection("season_clients")}
}

func (r *repository) Create(ctx context.Context, client *domain.SeasonClient) error {
	cleanTenantID, err := mongoinfra.SanitizeID(client.TenantID)
	if err != nil {
		return err
	}
	client.TenantID = cleanTenantID
	if client.ID == "" {
		client.ID = bson.NewObjectID().Hex()
	}
	cleanID, err := mongoinfra.SanitizeID(client.ID)
	if err != nil {
		return err
	}
	client.ID = cleanID

	now := time.Now().UTC()
	if client.CreatedAt.IsZero() {
		client.CreatedAt = now
	}
	client.UpdatedAt = now
	_, err = r.collection.InsertOne(ctx, client)
	return err
}

func (r *repository) GetByID(ctx context.Context, id, tenantID string) (*domain.SeasonClient, error) {
	cleanID, err := mongoinfra.SanitizeID(id)
	if err != nil {
		return nil, err
	}
	cleanTenantID, err := mongoinfra.SanitizeID(tenantID)
	if err != nil {
		return nil, err
	}

	var client domain.SeasonClient
	filter := bson.D{{Key: "_id", Value: cleanID}, {Key: "tenant_id", Value: cleanTenantID}}
	err = r.collection.FindOne(ctx, filter).Decode(&client)
	if err != nil {
		return nil, err
	}
	return &client, nil
}

func (r *repository) List(ctx context.Context, tenantID string) ([]*domain.SeasonClient, error) {
	cleanTenantID, err := mongoinfra.SanitizeID(tenantID)
	if err != nil {
		return nil, err
	}

	filter := bson.D{{Key: "tenant_id", Value: cleanTenantID}}
	cursor, err := r.collection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var list []*domain.SeasonClient
	if err = cursor.All(ctx, &list); err != nil {
		return nil, err
	}
	return list, nil
}

func (r *repository) Update(ctx context.Context, client *domain.SeasonClient) error {
	cleanID, err := mongoinfra.SanitizeID(client.ID)
	if err != nil {
		return err
	}
	cleanTenantID, err := mongoinfra.SanitizeID(client.TenantID)
	if err != nil {
		return err
	}
	client.ID = cleanID
	client.TenantID = cleanTenantID
	client.UpdatedAt = time.Now().UTC()

	filter := bson.D{{Key: "_id", Value: cleanID}, {Key: "tenant_id", Value: cleanTenantID}}
	updateDoc := bson.D{
		{Key: "$set", Value: bson.D{
			{Key: "person_id", Value: client.PersonID},
			{Key: "season_id", Value: client.SeasonID},
			{Key: "dogs", Value: client.Dogs},
			{Key: "updated_at", Value: client.UpdatedAt},
		}},
	}
	_, err = r.collection.UpdateOne(ctx, filter, updateDoc)
	return err
}

func (r *repository) Delete(ctx context.Context, id, tenantID string) error {
	cleanID, err := mongoinfra.SanitizeID(id)
	if err != nil {
		return err
	}
	cleanTenantID, err := mongoinfra.SanitizeID(tenantID)
	if err != nil {
		return err
	}

	filter := bson.D{{Key: "_id", Value: cleanID}, {Key: "tenant_id", Value: cleanTenantID}}
	_, err = r.collection.DeleteOne(ctx, filter)
	return err
}
