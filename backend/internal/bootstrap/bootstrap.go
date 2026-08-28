package bootstrap

import (
	"context"
	"fmt"
	"log"

	"ps/internal/application/ports/client"
	emailport "ps/internal/application/ports/email"
	"ps/internal/application/ports/person"
	"ps/internal/application/ports/photographer"
	"ps/internal/application/ports/season"
	tenantport "ps/internal/application/ports/tenant"
	userport "ps/internal/application/ports/user"
	"ps/internal/config"
	bcryptinfra "ps/internal/infrastructure/auth/bcrypt"
	jwtauth "ps/internal/infrastructure/auth/jwt"
	clientMongo "ps/internal/infrastructure/client/mongo"
	mongoinfra "ps/internal/infrastructure/database/mongo"
	emailinfra "ps/internal/infrastructure/email"
	personMongo "ps/internal/infrastructure/person/mongo"
	photographerMongo "ps/internal/infrastructure/photographer/mongo"
	seasonMongo "ps/internal/infrastructure/season/mongo"
	tenantMongo "ps/internal/infrastructure/tenant/mongo"
	userMongo "ps/internal/infrastructure/user/mongo"
	"ps/internal/interfaces/rest"

	"go.mongodb.org/mongo-driver/v2/mongo"
)

type App struct {
	handler     *rest.Router
	mongoClient *mongo.Client
}

func New(ctx context.Context, cfg config.Config) (*App, error) {
	var (
		users         userport.Repository
		tenants       tenantport.Repository
		seasons       season.Repository
		photographers photographer.Repository
		persons       person.Repository
		clients       client.Repository
		mongoClient   *mongo.Client
		emailSender   emailport.Sender
	)

	hasher := bcryptinfra.NewHasher()
	tokens := jwtauth.NewProvider(cfg.JWTSecret, cfg.JWTRefreshSecret)
	emailSender = emailinfra.NewService(emailinfra.Config{
		SMTPHost:   cfg.SMTPHost,
		SMTPPort:   cfg.SMTPPort,
		SMTPUser:   cfg.SMTPUser,
		SMTPPass:   cfg.SMTPPass,
		EmailFrom:  cfg.EmailFrom,
		AppBaseURL: cfg.AppBaseURL,
	})

	log.Printf("Connecting to MongoDB database %q...", cfg.MongoDatabase)
	mClient, err := mongoinfra.Connect(ctx, cfg.MongoURI)
	if err != nil {
		return nil, fmt.Errorf("could not connect to mongodb: %w", err)
	}
	mongoClient = mClient

	db := mongoClient.Database(cfg.MongoDatabase)
	uMongo := userMongo.NewRepository(db)
	tMongo := tenantMongo.NewRepository(db)
	sMongo := seasonMongo.NewRepository(db)
	pMongo := photographerMongo.NewRepository(db)
	peMongo := personMongo.NewRepository(db)
	cMongo := clientMongo.NewRepository(db)

	users = uMongo
	tenants = tMongo
	seasons = sMongo
	photographers = pMongo
	persons = peMongo
	clients = cMongo

	handler := rest.NewRouter(cfg, users, tenants, hasher, tokens, emailSender, seasons, photographers, persons, clients)
	return &App{
		handler:     handler,
		mongoClient: mongoClient,
	}, nil
}

func (a *App) Handler() *rest.Router {
	return a.handler
}

func (a *App) Close(ctx context.Context) error {
	if a.mongoClient != nil {
		return a.mongoClient.Disconnect(ctx)
	}
	return nil
}
