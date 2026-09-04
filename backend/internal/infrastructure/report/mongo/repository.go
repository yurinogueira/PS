package mongo

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	reportport "ps/internal/application/ports/report"
	domain "ps/internal/domain/report"
	mongoinfra "ps/internal/infrastructure/database/mongo"
)

type repository struct {
	collection *mongo.Collection
}

func NewRepository(db *mongo.Database) reportport.Repository {
	return &repository{collection: db.Collection("reports")}
}

func (r *repository) EnsureIndexes(ctx context.Context) error {
	models := []mongo.IndexModel{
		{
			Keys: bson.D{
				{Key: "tenant_id", Value: 1},
				{Key: "created_at", Value: -1},
			},
		},
		{
			Keys: bson.D{
				{Key: "tenant_id", Value: 1},
				{Key: "season_id", Value: 1},
				{Key: "created_at", Value: -1},
			},
		},
	}
	_, err := r.collection.Indexes().CreateMany(ctx, models)
	return err
}

func (r *repository) Create(ctx context.Context, job *domain.ReportJob) error {
	cleanTenantID, err := mongoinfra.SanitizeID(job.TenantID)
	if err != nil {
		return err
	}
	job.TenantID = cleanTenantID

	if job.ID == "" {
		job.ID = bson.NewObjectID().Hex()
	}
	cleanID, err := mongoinfra.SanitizeID(job.ID)
	if err != nil {
		return err
	}
	job.ID = cleanID

	if job.SeasonID != "" {
		cleanSeasonID, sErr := mongoinfra.SanitizeID(job.SeasonID)
		if sErr == nil {
			job.SeasonID = cleanSeasonID
		}
	}

	now := time.Now().UTC()
	if job.CreatedAt.IsZero() {
		job.CreatedAt = now
	}

	_, err = r.collection.InsertOne(ctx, job)
	return err
}

func (r *repository) Update(ctx context.Context, job *domain.ReportJob) error {
	cleanID, err := mongoinfra.SanitizeID(job.ID)
	if err != nil {
		return err
	}
	cleanTenantID, err := mongoinfra.SanitizeID(job.TenantID)
	if err != nil {
		return err
	}

	filter := bson.D{
		{Key: "_id", Value: cleanID},
		{Key: "tenant_id", Value: cleanTenantID},
	}

	update := bson.D{
		{Key: "$set", Value: bson.D{
			{Key: "status", Value: job.Status},
			{Key: "file_path", Value: job.FilePath},
			{Key: "error", Value: job.Error},
			{Key: "completed_at", Value: job.CompletedAt},
			{Key: "duration_ms", Value: job.DurationMS},
			{Key: "season_name", Value: job.SeasonName},
		}},
	}

	_, err = r.collection.UpdateOne(ctx, filter, update)
	return err
}

func (r *repository) GetByID(ctx context.Context, id, tenantID string) (*domain.ReportJob, error) {
	cleanID, err := mongoinfra.SanitizeID(id)
	if err != nil {
		return nil, err
	}
	cleanTenantID, err := mongoinfra.SanitizeID(tenantID)
	if err != nil {
		return nil, err
	}

	filter := bson.D{
		{Key: "_id", Value: cleanID},
		{Key: "tenant_id", Value: cleanTenantID},
	}

	var job domain.ReportJob
	err = r.collection.FindOne(ctx, filter).Decode(&job)
	if err != nil {
		return nil, err
	}
	return &job, nil
}

func (r *repository) List(ctx context.Context, filter reportport.ListFilter) (*reportport.ListResult, error) {
	cleanTenantID, err := mongoinfra.SanitizeID(filter.TenantID)
	if err != nil {
		return nil, err
	}

	page := filter.Page
	if page < 1 {
		page = 1
	}
	limit := filter.Limit
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	skip := int64((page - 1) * limit)

	filterConditions := bson.D{{Key: "tenant_id", Value: cleanTenantID}}
	if filter.SeasonID != "" {
		cleanSeasonID, sErr := mongoinfra.SanitizeID(filter.SeasonID)
		if sErr == nil && cleanSeasonID != "" {
			filterConditions = append(filterConditions, bson.E{Key: "season_id", Value: cleanSeasonID})
		}
	}

	total, err := r.collection.CountDocuments(ctx, filterConditions)
	if err != nil {
		return nil, err
	}

	findOpts := options.Find().
		SetSort(bson.D{{Key: "created_at", Value: -1}}).
		SetSkip(skip).
		SetLimit(int64(limit))

	cursor, err := r.collection.Find(ctx, filterConditions, findOpts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var jobs []*domain.ReportJob
	if err := cursor.All(ctx, &jobs); err != nil {
		return nil, err
	}
	if jobs == nil {
		jobs = make([]*domain.ReportJob, 0)
	}

	return &reportport.ListResult{
		Jobs:  jobs,
		Total: total,
		Page:  page,
		Limit: limit,
	}, nil
}
