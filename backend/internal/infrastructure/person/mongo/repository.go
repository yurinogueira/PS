package mongo

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"ps/internal/application/ports/person"
	domain "ps/internal/domain/person"
	mongoinfra "ps/internal/infrastructure/database/mongo"
)

type repository struct {
	collection *mongo.Collection
}

func NewRepository(db *mongo.Database) person.Repository {
	return &repository{collection: db.Collection("people")}
}

func (r *repository) Create(ctx context.Context, person *domain.Person) error {
	cleanTenantID, err := mongoinfra.SanitizeID(person.TenantID)
	if err != nil {
		return err
	}
	person.TenantID = cleanTenantID
	if person.ID == "" {
		person.ID = bson.NewObjectID().Hex()
	}
	cleanID, err := mongoinfra.SanitizeID(person.ID)
	if err != nil {
		return err
	}
	person.ID = cleanID

	now := time.Now().UTC()
	if person.CreatedAt.IsZero() {
		person.CreatedAt = now
	}
	person.UpdatedAt = now
	_, err = r.collection.InsertOne(ctx, person)
	return err
}

func (r *repository) GetByID(ctx context.Context, id, tenantID string) (*domain.Person, error) {
	cleanID, err := mongoinfra.SanitizeID(id)
	if err != nil {
		return nil, err
	}
	cleanTenantID, err := mongoinfra.SanitizeID(tenantID)
	if err != nil {
		return nil, err
	}

	var person domain.Person
	filter := bson.D{{Key: "_id", Value: cleanID}, {Key: "tenant_id", Value: cleanTenantID}}
	err = r.collection.FindOne(ctx, filter).Decode(&person)
	if err != nil {
		return nil, err
	}
	return &person, nil
}

func (r *repository) List(ctx context.Context, tenantID string) ([]*domain.Person, error) {
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

	list := make([]*domain.Person, 0)
	if err = cursor.All(ctx, &list); err != nil {
		return nil, err
	}
	return list, nil
}

func (r *repository) Update(ctx context.Context, person *domain.Person) error {
	cleanID, err := mongoinfra.SanitizeID(person.ID)
	if err != nil {
		return err
	}
	cleanTenantID, err := mongoinfra.SanitizeID(person.TenantID)
	if err != nil {
		return err
	}
	person.ID = cleanID
	person.TenantID = cleanTenantID
	person.UpdatedAt = time.Now().UTC()

	filter := bson.D{{Key: "_id", Value: cleanID}, {Key: "tenant_id", Value: cleanTenantID}}
	updateDoc := bson.D{
		{Key: "$set", Value: bson.D{
			{Key: "name", Value: person.Name},
			{Key: "email", Value: person.Email},
			{Key: "alternative_email", Value: person.AlternativeEmail},
			{Key: "phone", Value: person.Phone},
			{Key: "updated_at", Value: person.UpdatedAt},
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
