package mongo

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"ps/internal/application/ports/season"
	domain "ps/internal/domain/season"
	mongoinfra "ps/internal/infrastructure/database/mongo"
)

type repository struct {
	collection *mongo.Collection
}

func NewRepository(db *mongo.Database) season.Repository {
	return &repository{collection: db.Collection("seasons")}
}

func (r *repository) Create(ctx context.Context, season *domain.Season) error {
	cleanTenantID, err := mongoinfra.SanitizeID(season.TenantID)
	if err != nil {
		return err
	}
	season.TenantID = cleanTenantID
	if season.ID == "" {
		season.ID = bson.NewObjectID().Hex()
	}
	cleanID, err := mongoinfra.SanitizeID(season.ID)
	if err != nil {
		return err
	}
	season.ID = cleanID

	now := time.Now().UTC()
	if season.CreatedAt.IsZero() {
		season.CreatedAt = now
	}
	season.UpdatedAt = now
	_, err = r.collection.InsertOne(ctx, season)
	return err
}

func (r *repository) GetByID(ctx context.Context, id, tenantID string) (*domain.Season, error) {
	cleanID, err := mongoinfra.SanitizeID(id)
	if err != nil {
		return nil, err
	}
	cleanTenantID, err := mongoinfra.SanitizeID(tenantID)
	if err != nil {
		return nil, err
	}

	var season domain.Season
	filter := bson.D{{Key: "_id", Value: cleanID}, {Key: "tenant_id", Value: cleanTenantID}}
	err = r.collection.FindOne(ctx, filter).Decode(&season)
	if err != nil {
		return nil, err
	}
	return &season, nil
}

func (r *repository) List(ctx context.Context, tenantID string) ([]*domain.Season, error) {
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

	var list []*domain.Season
	if err = cursor.All(ctx, &list); err != nil {
		return nil, err
	}
	return list, nil
}

func (r *repository) Update(ctx context.Context, season *domain.Season) error {
	cleanID, err := mongoinfra.SanitizeID(season.ID)
	if err != nil {
		return err
	}
	cleanTenantID, err := mongoinfra.SanitizeID(season.TenantID)
	if err != nil {
		return err
	}
	season.ID = cleanID
	season.TenantID = cleanTenantID
	season.UpdatedAt = time.Now().UTC()

	filter := bson.D{{Key: "_id", Value: cleanID}, {Key: "tenant_id", Value: cleanTenantID}}
	updateDoc := bson.D{
		{Key: "$set", Value: bson.D{
			{Key: "name", Value: season.Name},
			{Key: "photographer_ids", Value: season.PhotographerIDs},
			{Key: "updated_at", Value: season.UpdatedAt},
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
