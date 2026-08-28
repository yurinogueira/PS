package mongo

import (
	"context"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	domain "ps/internal/domain/client"
	"ps/internal/application/ports/client"
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

func (r *repository) GetByID(ctx context.Context, id string) (*domain.SeasonClient, error) {
	var client domain.SeasonClient
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&client)
	if err != nil {
		return nil, err
	}
	return &client, nil
}

func (r *repository) List(ctx context.Context) ([]*domain.SeasonClient, error) {
	cursor, err := r.collection.Find(ctx, bson.M{})
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
	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": client.ID}, bson.M{"$set": client})
	return err
}

func (r *repository) Delete(ctx context.Context, id string) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}
