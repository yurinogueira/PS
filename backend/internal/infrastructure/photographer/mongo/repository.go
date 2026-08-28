package mongo

import (
	"context"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	domain "ps/internal/domain/photographer"
	"ps/internal/application/ports/photographer"
)

type repository struct {
	collection *mongo.Collection
}

func NewRepository(db *mongo.Database) photographer.Repository {
	return &repository{collection: db.Collection("photographers")}
}

func (r *repository) Create(ctx context.Context, photographer *domain.Photographer) error {
	photographer.ID = bson.NewObjectID().Hex()
	_, err := r.collection.InsertOne(ctx, photographer)
	return err
}

func (r *repository) GetByID(ctx context.Context, id string) (*domain.Photographer, error) {
	var photographer domain.Photographer
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&photographer)
	if err != nil {
		return nil, err
	}
	return &photographer, nil
}

func (r *repository) List(ctx context.Context) ([]*domain.Photographer, error) {
	cursor, err := r.collection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var list []*domain.Photographer
	if err = cursor.All(ctx, &list); err != nil {
		return nil, err
	}
	return list, nil
}

func (r *repository) Update(ctx context.Context, photographer *domain.Photographer) error {
	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": photographer.ID}, bson.M{"$set": photographer})
	return err
}

func (r *repository) Delete(ctx context.Context, id string) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}
