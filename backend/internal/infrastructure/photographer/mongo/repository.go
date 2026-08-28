package mongo

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"ps/internal/application/ports/photographer"
	domain "ps/internal/domain/photographer"
	mongoinfra "ps/internal/infrastructure/database/mongo"
)

type repository struct {
	collection *mongo.Collection
}

func NewRepository(db *mongo.Database) photographer.Repository {
	return &repository{collection: db.Collection("photographers")}
}

func (r *repository) Create(ctx context.Context, photographer *domain.Photographer) error {
	cleanTenantID, err := mongoinfra.SanitizeID(photographer.TenantID)
	if err != nil {
		return err
	}
	photographer.TenantID = cleanTenantID
	if photographer.ID == "" {
		photographer.ID = bson.NewObjectID().Hex()
	}
	cleanID, err := mongoinfra.SanitizeID(photographer.ID)
	if err != nil {
		return err
	}
	photographer.ID = cleanID

	now := time.Now().UTC()
	if photographer.CreatedAt.IsZero() {
		photographer.CreatedAt = now
	}
	photographer.UpdatedAt = now
	_, err = r.collection.InsertOne(ctx, photographer)
	return err
}

func (r *repository) GetByID(ctx context.Context, id, tenantID string) (*domain.Photographer, error) {
	cleanID, err := mongoinfra.SanitizeID(id)
	if err != nil {
		return nil, err
	}
	cleanTenantID, err := mongoinfra.SanitizeID(tenantID)
	if err != nil {
		return nil, err
	}

	var photographer domain.Photographer
	filter := bson.D{{Key: "_id", Value: cleanID}, {Key: "tenant_id", Value: cleanTenantID}}
	err = r.collection.FindOne(ctx, filter).Decode(&photographer)
	if err != nil {
		return nil, err
	}
	return &photographer, nil
}

func (r *repository) List(ctx context.Context, tenantID string) ([]*domain.Photographer, error) {
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

	list := make([]*domain.Photographer, 0)
	if err = cursor.All(ctx, &list); err != nil {
		return nil, err
	}
	return list, nil
}

func (r *repository) Update(ctx context.Context, photographer *domain.Photographer) error {
	cleanID, err := mongoinfra.SanitizeID(photographer.ID)
	if err != nil {
		return err
	}
	cleanTenantID, err := mongoinfra.SanitizeID(photographer.TenantID)
	if err != nil {
		return err
	}
	photographer.ID = cleanID
	photographer.TenantID = cleanTenantID
	photographer.UpdatedAt = time.Now().UTC()

	filter := bson.D{{Key: "_id", Value: cleanID}, {Key: "tenant_id", Value: cleanTenantID}}
	updateDoc := bson.D{
		{Key: "$set", Value: bson.D{
			{Key: "name", Value: photographer.Name},
			{Key: "updated_at", Value: photographer.UpdatedAt},
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
