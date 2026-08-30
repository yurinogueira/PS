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
	Name          string     `bson:"_id"`
	Plan          string     `bson:"plan"`
	PaymentStatus string     `bson:"paymentStatus"`
	PlanStartedAt *time.Time `bson:"planStartedAt,omitempty"`
	PlanExpiresAt *time.Time `bson:"planExpiresAt,omitempty"`
	CreatedAt     time.Time  `bson:"createdAt"`
	UpdatedAt     time.Time  `bson:"updatedAt,omitempty"`
}

func (d tenantDoc) toDomain() domaintenant.Tenant {
	plan := d.Plan
	if plan == "" {
		plan = domaintenant.PlanFree
	}
	paymentStatus := d.PaymentStatus
	if paymentStatus == "" {
		paymentStatus = domaintenant.PaymentStatusPaid
	}
	startedAt := d.PlanStartedAt
	if startedAt == nil && !d.CreatedAt.IsZero() {
		startedAt = &d.CreatedAt
	}
	expiresAt := d.PlanExpiresAt
	if expiresAt == nil && plan == domaintenant.PlanFree && startedAt != nil {
		exp := startedAt.Add(domaintenant.TrialDurationDays * 24 * time.Hour)
		expiresAt = &exp
	}

	return domaintenant.Tenant{
		Name:          d.Name,
		Plan:          plan,
		PaymentStatus: paymentStatus,
		PlanStartedAt: startedAt,
		PlanExpiresAt: expiresAt,
		CreatedAt:     d.CreatedAt,
		UpdatedAt:     d.UpdatedAt,
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

	now := time.Now().UTC()
	if tenant.CreatedAt.IsZero() {
		tenant.CreatedAt = now
	}
	if tenant.UpdatedAt.IsZero() {
		tenant.UpdatedAt = now
	}
	if tenant.Plan == "" {
		tenant.Plan = domaintenant.PlanFree
	}
	if tenant.PaymentStatus == "" {
		tenant.PaymentStatus = domaintenant.PaymentStatusPaid
	}
	if tenant.PlanStartedAt == nil {
		tenant.PlanStartedAt = &now
	}
	if tenant.Plan == domaintenant.PlanFree && tenant.PlanExpiresAt == nil {
		exp := tenant.PlanStartedAt.Add(domaintenant.TrialDurationDays * 24 * time.Hour)
		tenant.PlanExpiresAt = &exp
	}

	doc := tenantDoc{
		Name:          tenant.Name,
		Plan:          tenant.Plan,
		PaymentStatus: tenant.PaymentStatus,
		PlanStartedAt: tenant.PlanStartedAt,
		PlanExpiresAt: tenant.PlanExpiresAt,
		CreatedAt:     tenant.CreatedAt,
		UpdatedAt:     tenant.UpdatedAt,
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

func (r *Repository) Update(ctx context.Context, tenant domaintenant.Tenant) (domaintenant.Tenant, error) {
	cleanName, err := mongoinfra.SanitizeID(tenant.Name)
	if err != nil {
		return domaintenant.Tenant{}, err
	}
	tenant.Name = cleanName
	tenant.UpdatedAt = time.Now().UTC()

	filter := bson.D{{Key: "_id", Value: cleanName}}
	updateDoc := bson.D{
		{Key: "$set", Value: bson.D{
			{Key: "plan", Value: tenant.Plan},
			{Key: "paymentStatus", Value: tenant.PaymentStatus},
			{Key: "planStartedAt", Value: tenant.PlanStartedAt},
			{Key: "planExpiresAt", Value: tenant.PlanExpiresAt},
			{Key: "updatedAt", Value: tenant.UpdatedAt},
		}},
	}

	res, err := r.coll.UpdateOne(ctx, filter, updateDoc)
	if err != nil {
		return domaintenant.Tenant{}, err
	}
	if res.MatchedCount == 0 {
		return domaintenant.Tenant{}, tenantport.ErrNotFound
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
