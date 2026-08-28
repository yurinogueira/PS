package mongo

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	tenantport "ps/internal/application/ports/tenant"
	domaintenant "ps/internal/domain/tenant"
	mongoinfra "ps/internal/infrastructure/database/mongo"
)

type tenantDoc struct {
	Name      string    `bson:"_id"`
	CreatedAt time.Time `bson:"createdAt"`
}

func (d tenantDoc) toDomain() domaintenant.Tenant {
	return domaintenant.Tenant{
		Name:      d.Name,
		CreatedAt: d.CreatedAt,
	}
}

type Repository struct {
	coll *mongo.Collection
}

func NewRepository(db *mongo.Database) *Repository {
	return &Repository{
		coll: db.Collection("tenants"),
	}
}

func (r *Repository) Create(ctx context.Context, tenant domaintenant.Tenant) (domaintenant.Tenant, error) {
	cleanName, err := mongoinfra.SanitizeID(tenant.Name)
	if err != nil {
		return domaintenant.Tenant{}, err
	}
	tenant.Name = cleanName

	if tenant.CreatedAt.IsZero() {
		tenant.CreatedAt = time.Now().UTC()
	}

	doc := tenantDoc{
		Name:      tenant.Name,
		CreatedAt: tenant.CreatedAt,
	}

	_, err = r.coll.InsertOne(ctx, doc)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return domaintenant.Tenant{}, tenantport.ErrAlreadyExists
		}
		return domaintenant.Tenant{}, err
	}

	return tenant, nil
}

func (r *Repository) FindByName(ctx context.Context, name string) (domaintenant.Tenant, error) {
	cleanName, err := mongoinfra.SanitizeID(name)
	if err != nil {
		return domaintenant.Tenant{}, tenantport.ErrNotFound
	}

	filter := bson.D{{Key: "_id", Value: cleanName}}
	var doc tenantDoc
	err = r.coll.FindOne(ctx, filter).Decode(&doc)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return domaintenant.Tenant{}, tenantport.ErrNotFound
		}
		return domaintenant.Tenant{}, err
	}
	return doc.toDomain(), nil
}

func (r *Repository) List(ctx context.Context) ([]domaintenant.Tenant, error) {
	cursor, err := r.coll.Find(ctx, bson.D{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var docs []tenantDoc
	if err := cursor.All(ctx, &docs); err != nil {
		return nil, err
	}

	tenants := make([]domaintenant.Tenant, 0, len(docs))
	for _, d := range docs {
		tenants = append(tenants, d.toDomain())
	}
	return tenants, nil
}
