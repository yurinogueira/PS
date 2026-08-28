package mongo

import (
	"context"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"ps/internal/application/ports/person"
	domain "ps/internal/domain/person"
)

type repository struct {
	collection *mongo.Collection
}

func NewRepository(db *mongo.Database) person.Repository {
	return &repository{collection: db.Collection("people")}
}

func (r *repository) Create(ctx context.Context, person *domain.Person) error {
	person.ID = bson.NewObjectID().Hex()
	_, err := r.collection.InsertOne(ctx, person)
	return err
}

func (r *repository) GetByID(ctx context.Context, id, tenantID string) (*domain.Person, error) {
	var person domain.Person
	err := r.collection.FindOne(ctx, bson.M{"_id": id, "tenant_id": tenantID}).Decode(&person)
	if err != nil {
		return nil, err
	}
	return &person, nil
}

func (r *repository) List(ctx context.Context, tenantID string) ([]*domain.Person, error) {
	cursor, err := r.collection.Find(ctx, bson.M{"tenant_id": tenantID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var list []*domain.Person
	if err = cursor.All(ctx, &list); err != nil {
		return nil, err
	}
	return list, nil
}

func (r *repository) Update(ctx context.Context, person *domain.Person) error {
	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": person.ID, "tenant_id": person.TenantID}, bson.M{"$set": person})
	return err
}

func (r *repository) Delete(ctx context.Context, id, tenantID string) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id, "tenant_id": tenantID})
	return err
}
