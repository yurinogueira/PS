package mongo

import (
	"context"
	"regexp"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"ps/internal/application/ports/client"
	domain "ps/internal/domain/client"
	mongoinfra "ps/internal/infrastructure/database/mongo"
)

type repository struct {
	collection *mongo.Collection
}

func NewRepository(db *mongo.Database) client.Repository {
	return &repository{collection: db.Collection("season_clients")}
}

func (r *repository) Create(ctx context.Context, client *domain.SeasonClient) error {
	cleanTenantID, err := mongoinfra.SanitizeID(client.TenantID)
	if err != nil {
		return err
	}
	client.TenantID = cleanTenantID
	if client.ID == "" {
		client.ID = bson.NewObjectID().Hex()
	}
	cleanID, err := mongoinfra.SanitizeID(client.ID)
	if err != nil {
		return err
	}
	client.ID = cleanID

	now := time.Now().UTC()
	if client.CreatedAt.IsZero() {
		client.CreatedAt = now
	}
	client.UpdatedAt = now
	_, err = r.collection.InsertOne(ctx, client)
	return err
}

func (r *repository) GetByID(ctx context.Context, id, tenantID string) (*domain.SeasonClient, error) {
	cleanID, err := mongoinfra.SanitizeID(id)
	if err != nil {
		return nil, err
	}
	cleanTenantID, err := mongoinfra.SanitizeID(tenantID)
	if err != nil {
		return nil, err
	}

	var client domain.SeasonClient
	filter := bson.D{{Key: "_id", Value: cleanID}, {Key: "tenant_id", Value: cleanTenantID}}
	err = r.collection.FindOne(ctx, filter).Decode(&client)
	if err != nil {
		return nil, err
	}
	return &client, nil
}

func (r *repository) List(ctx context.Context, tenantID string, filter domain.ListFilter) (*domain.PaginatedClients, error) {
	cleanTenantID, err := mongoinfra.SanitizeID(tenantID)
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

	matchConditions := bson.D{{Key: "tenant_id", Value: cleanTenantID}}
	if filter.SeasonID != "" {
		cleanSeasonID, err := mongoinfra.SanitizeID(filter.SeasonID)
		if err == nil && cleanSeasonID != "" {
			matchConditions = append(matchConditions, bson.E{Key: "season_id", Value: cleanSeasonID})
		} else {
			// Se o ID da temporada informado for inválido, não retorna nenhum documento
			return &domain.PaginatedClients{
				Data:  make([]*domain.SeasonClient, 0),
				Total: 0,
				Page:  page,
				Limit: limit,
			}, nil
		}
	}

	pipeline := mongo.Pipeline{
		bson.D{{Key: "$match", Value: matchConditions}},
		bson.D{{Key: "$lookup", Value: bson.D{
			{Key: "from", Value: "people"},
			{Key: "localField", Value: "person_id"},
			{Key: "foreignField", Value: "_id"},
			{Key: "as", Value: "person_doc"},
		}}},
	}

	searchTrimmed := strings.TrimSpace(filter.Search)
	if searchTrimmed != "" {
		if len(searchTrimmed) > 100 {
			searchTrimmed = searchTrimmed[:100]
		}
		pattern := regexp.QuoteMeta(searchTrimmed)
		regexDoc := bson.D{{Key: "$regex", Value: pattern}, {Key: "$options", Value: "i"}}
		orConditions := bson.A{
			bson.D{{Key: "person_doc.name", Value: regexDoc}},
			bson.D{{Key: "person_doc.email", Value: regexDoc}},
			bson.D{{Key: "person_doc.alternative_email", Value: regexDoc}},
			bson.D{{Key: "person_doc.phone", Value: regexDoc}},
			bson.D{{Key: "dogs.breed", Value: regexDoc}},
			bson.D{{Key: "dogs.judge", Value: regexDoc}},
			bson.D{{Key: "dogs.photos.file_number", Value: regexDoc}},
		}
		pipeline = append(pipeline, bson.D{{Key: "$match", Value: bson.D{{Key: "$or", Value: orConditions}}}})
	}

	type facetResult struct {
		Metadata []struct {
			Total int64 `bson:"total"`
		} `bson:"metadata"`
		Data []*domain.SeasonClient `bson:"data"`
	}

	pipeline = append(pipeline, bson.D{{Key: "$facet", Value: bson.D{
		{Key: "metadata", Value: bson.A{bson.D{{Key: "$count", Value: "total"}}}},
		{Key: "data", Value: bson.A{
			bson.D{{Key: "$sort", Value: bson.D{
				{Key: "created_at", Value: -1},
				{Key: "_id", Value: -1},
			}}},
			bson.D{{Key: "$skip", Value: skip}},
			bson.D{{Key: "$limit", Value: int64(limit)}},
		}},
	}}})

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []facetResult
	if err = cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	if len(results) == 0 {
		return &domain.PaginatedClients{
			Data:  make([]*domain.SeasonClient, 0),
			Total: 0,
			Page:  page,
			Limit: limit,
		}, nil
	}

	total := int64(0)
	if len(results[0].Metadata) > 0 {
		total = results[0].Metadata[0].Total
	}

	data := results[0].Data
	if data == nil {
		data = make([]*domain.SeasonClient, 0)
	}
	for _, c := range data {
		if c.Dogs == nil {
			c.Dogs = make([]domain.Dog, 0)
		}
		for i := range c.Dogs {
			if c.Dogs[i].Photos == nil {
				c.Dogs[i].Photos = make([]domain.Photo, 0)
			}
		}
	}

	return &domain.PaginatedClients{
		Data:  data,
		Total: total,
		Page:  page,
		Limit: limit,
	}, nil
}

func (r *repository) Update(ctx context.Context, client *domain.SeasonClient) error {
	cleanID, err := mongoinfra.SanitizeID(client.ID)
	if err != nil {
		return err
	}
	cleanTenantID, err := mongoinfra.SanitizeID(client.TenantID)
	if err != nil {
		return err
	}
	client.ID = cleanID
	client.TenantID = cleanTenantID
	client.UpdatedAt = time.Now().UTC()

	filter := bson.D{{Key: "_id", Value: cleanID}, {Key: "tenant_id", Value: cleanTenantID}}
	updateDoc := bson.D{
		{Key: "$set", Value: bson.D{
			{Key: "person_id", Value: client.PersonID},
			{Key: "season_id", Value: client.SeasonID},
			{Key: "dogs", Value: client.Dogs},
			{Key: "updated_at", Value: client.UpdatedAt},
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
