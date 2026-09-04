package mongo

import (
	"context"
	"math"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	auditport "ps/internal/application/ports/auditlog"
	domainaudit "ps/internal/domain/auditlog"
	mongoinfra "ps/internal/infrastructure/database/mongo"
)

type repository struct {
	collection *mongo.Collection
}

func NewRepository(db *mongo.Database) auditport.Repository {
	return &repository{collection: db.Collection("audit_logs")}
}

func (r *repository) EnsureIndexes(ctx context.Context) error {
	models := []mongo.IndexModel{
		{
			Keys: bson.D{
				{Key: "created_at", Value: -1},
			},
		},
		{
			Keys: bson.D{
				{Key: "tenant_id", Value: 1},
				{Key: "created_at", Value: -1},
			},
		},
		{
			Keys: bson.D{
				{Key: "entity_type", Value: 1},
				{Key: "entity_id", Value: 1},
			},
		},
		{
			Keys: bson.D{
				{Key: "user_id", Value: 1},
			},
		},
	}
	_, err := r.collection.Indexes().CreateMany(ctx, models)
	return err
}

func (r *repository) Create(ctx context.Context, log *domainaudit.AuditLog) error {
	if log.TenantID != "" {
		cleanTenantID, err := mongoinfra.SanitizeID(log.TenantID)
		if err == nil {
			log.TenantID = cleanTenantID
		}
	}

	if log.ID == "" {
		log.ID = bson.NewObjectID().Hex()
	}

	if log.CreatedAt.IsZero() {
		log.CreatedAt = time.Now().UTC()
	}

	_, err := r.collection.InsertOne(ctx, log)
	return err
}

func (r *repository) List(ctx context.Context, filter auditport.Filter) (auditport.PaginatedResult, error) {
	page := filter.Page
	if page < 1 {
		page = 1
	}

	limit := filter.Limit
	if limit <= 0 {
		limit = 20
	} else if limit > 100 {
		limit = 100
	}

	filterDoc := bson.D{}

	if filter.TenantID != "" {
		filterDoc = append(filterDoc, bson.E{Key: "tenant_id", Value: filter.TenantID})
	}

	if filter.EntityType != "" {
		filterDoc = append(filterDoc, bson.E{Key: "entity_type", Value: filter.EntityType})
	}

	if filter.Action != "" {
		filterDoc = append(filterDoc, bson.E{Key: "action", Value: filter.Action})
	}

	if filter.UserID != "" {
		filterDoc = append(filterDoc, bson.E{Key: "user_id", Value: filter.UserID})
	}

	if filter.StartDate != nil || filter.EndDate != nil {
		dateRange := bson.M{}
		if filter.StartDate != nil {
			dateRange["$gte"] = *filter.StartDate
		}
		if filter.EndDate != nil {
			dateRange["$lte"] = *filter.EndDate
		}
		filterDoc = append(filterDoc, bson.E{Key: "created_at", Value: dateRange})
	}

	total, err := r.collection.CountDocuments(ctx, filterDoc)
	if err != nil {
		return auditport.PaginatedResult{}, err
	}

	opts := options.Find().
		SetSort(bson.D{{Key: "created_at", Value: -1}}).
		SetSkip(int64((page - 1) * limit)).
		SetLimit(int64(limit))

	cursor, err := r.collection.Find(ctx, filterDoc, opts)
	if err != nil {
		return auditport.PaginatedResult{}, err
	}
	defer cursor.Close(ctx)

	var items []domainaudit.AuditLog
	if err := cursor.All(ctx, &items); err != nil {
		return auditport.PaginatedResult{}, err
	}

	if items == nil {
		items = []domainaudit.AuditLog{}
	}

	totalPages := int(math.Ceil(float64(total) / float64(limit)))

	return auditport.PaginatedResult{
		Items:      items,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}
