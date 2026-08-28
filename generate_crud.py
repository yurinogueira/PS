import os

entities = [
    {"name": "Season", "pkg": "season", "var": "season", "coll": "seasons"},
    {"name": "Photographer", "pkg": "photographer", "var": "photographer", "coll": "photographers"},
    {"name": "Person", "pkg": "person", "var": "person", "coll": "people"},
    {"name": "SeasonClient", "pkg": "client", "var": "client", "coll": "season_clients"},
]

base_dir = "backend/internal"

for e in entities:
    name = e["name"]
    pkg = e["pkg"]
    var = e["var"]
    coll = e["coll"]

    # Ports
    os.makedirs(f"{base_dir}/application/ports/{pkg}", exist_ok=True)
    with open(f"{base_dir}/application/ports/{pkg}/repository.go", "w") as f:
        f.write(f"""package {pkg}

import (
	"context"
	"ps/internal/domain/{pkg}"
)

type Repository interface {{
	Create(ctx context.Context, {var} *{pkg}.{name}) error
	GetByID(ctx context.Context, id string) (*{pkg}.{name}, error)
	List(ctx context.Context) ([]*{pkg}.{name}, error)
	Update(ctx context.Context, {var} *{pkg}.{name}) error
	Delete(ctx context.Context, id string) error
}}
""")

    # Usecase
    os.makedirs(f"{base_dir}/application/usecase/{pkg}", exist_ok=True)
    with open(f"{base_dir}/application/usecase/{pkg}/service.go", "w") as f:
        f.write(f"""package {pkg}

import (
	"context"
	"ps/internal/application/ports/{pkg}"
	domain "ps/internal/domain/{pkg}"
)

type Service struct {{
	repo {pkg}.Repository
}}

func NewService(repo {pkg}.Repository) *Service {{
	return &Service{{repo: repo}}
}}

func (s *Service) Create(ctx context.Context, {var} *domain.{name}) error {{
	return s.repo.Create(ctx, {var})
}}

func (s *Service) GetByID(ctx context.Context, id string) (*domain.{name}, error) {{
	return s.repo.GetByID(ctx, id)
}}

func (s *Service) List(ctx context.Context) ([]*domain.{name}, error) {{
	return s.repo.List(ctx)
}}

func (s *Service) Update(ctx context.Context, {var} *domain.{name}) error {{
	return s.repo.Update(ctx, {var})
}}

func (s *Service) Delete(ctx context.Context, id string) error {{
	return s.repo.Delete(ctx, id)
}}
""")

    # Mongo Repo
    os.makedirs(f"{base_dir}/infrastructure/{pkg}/mongo", exist_ok=True)
    with open(f"{base_dir}/infrastructure/{pkg}/mongo/repository.go", "w") as f:
        f.write(f"""package mongo

import (
	"context"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	domain "ps/internal/domain/{pkg}"
	"ps/internal/application/ports/{pkg}"
)

type repository struct {{
	collection *mongo.Collection
}}

func NewRepository(db *mongo.Database) {pkg}.Repository {{
	return &repository{{collection: db.Collection("{coll}")}}
}}

func (r *repository) Create(ctx context.Context, {var} *domain.{name}) error {{
	{var}.ID = bson.NewObjectID().Hex()
	_, err := r.collection.InsertOne(ctx, {var})
	return err
}}

func (r *repository) GetByID(ctx context.Context, id string) (*domain.{name}, error) {{
	var {var} domain.{name}
	err := r.collection.FindOne(ctx, bson.M{{"_id": id}}).Decode(&{var})
	if err != nil {{
		return nil, err
	}}
	return &{var}, nil
}}

func (r *repository) List(ctx context.Context) ([]*domain.{name}, error) {{
	cursor, err := r.collection.Find(ctx, bson.M{{}})
	if err != nil {{
		return nil, err
	}}
	defer cursor.Close(ctx)

	var list []*domain.{name}
	if err = cursor.All(ctx, &list); err != nil {{
		return nil, err
	}}
	return list, nil
}}

func (r *repository) Update(ctx context.Context, {var} *domain.{name}) error {{
	_, err := r.collection.UpdateOne(ctx, bson.M{{"_id": {var}.ID}}, bson.M{{"$set": {var}}})
	return err
}}

func (r *repository) Delete(ctx context.Context, id string) error {{
	_, err := r.collection.DeleteOne(ctx, bson.M{{"_id": id}})
	return err
}}
""")

    # Handlers
    with open(f"{base_dir}/interfaces/rest/handlers/{pkg}_handler.go", "w") as f:
        f.write(f"""package handlers

import (
	"encoding/json"
	"net/http"
	"ps/internal/application/usecase/{pkg}"
	domain "ps/internal/domain/{pkg}"
)

type {name}Handler struct {{
	service *{pkg}.Service
}}

func New{name}Handler(service *{pkg}.Service) *{name}Handler {{
	return &{name}Handler{{service: service}}
}}

func (h *{name}Handler) Create(w http.ResponseWriter, r *http.Request) {{
	var req domain.{name}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {{
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}}

	if err := h.service.Create(r.Context(), &req); err != nil {{
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(req)
}}

func (h *{name}Handler) List(w http.ResponseWriter, r *http.Request) {{
	list, err := h.service.List(r.Context())
	if err != nil {{
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}}
""")

