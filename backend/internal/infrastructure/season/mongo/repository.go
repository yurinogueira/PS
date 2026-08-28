package mongo

import (
	"context"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	domain "ps/internal/domain/season"
	"ps/internal/application/ports/season"
)

type repository struct {
	collection *mongo.Collection
}

func NewRepository(db *mongo.Database) season.Repository {
	return &repository{collection: db.Collection("seasons")}
}

func (r *repository) Create(ctx context.Context, season *domain.Season) error {
	season.ID = bson.NewObjectID().Hex()
	_, err := r.collection.InsertOne(ctx, season)
	return err
}

func (r *repository) GetByID(ctx context.Context, id string) (*domain.Season, error) {
	var season domain.Season
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&season)
	if err != nil {
		return nil, err
	}
	return &season, nil
}

func (r *repository) List(ctx context.Context) ([]*domain.Season, error) {
	cursor, err := r.collection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var list []*domain.Season
	if err = cursor.All(ctx, &list); err != nil {
		return nil, err
	}
	return list, nil
}

func (r *repository) Update(ctx context.Context, season *domain.Season) error {
	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": season.ID}, bson.M{"$set": season})
	return err
}

func (r *repository) Delete(ctx context.Context, id string) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}
