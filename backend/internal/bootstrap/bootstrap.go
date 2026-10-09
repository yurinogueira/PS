package bootstrap

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"ps/internal/application/ports/client"
	emailport "ps/internal/application/ports/email"
	"ps/internal/application/ports/person"
	"ps/internal/application/ports/photographer"
	"ps/internal/application/ports/season"
	storageport "ps/internal/application/ports/storage"
	tenantport "ps/internal/application/ports/tenant"
	userport "ps/internal/application/ports/user"
	reportusecase "ps/internal/application/usecase/report"
	"ps/internal/config"
	auditMongo "ps/internal/infrastructure/auditlog/mongo"
	bcryptinfra "ps/internal/infrastructure/auth/bcrypt"
	jwtauth "ps/internal/infrastructure/auth/jwt"
	clientMongo "ps/internal/infrastructure/client/mongo"
	mongoinfra "ps/internal/infrastructure/database/mongo"
	emailinfra "ps/internal/infrastructure/email"
	personMongo "ps/internal/infrastructure/person/mongo"
	photographerMongo "ps/internal/infrastructure/photographer/mongo"
	reportMongo "ps/internal/infrastructure/report/mongo"
	seasonMongo "ps/internal/infrastructure/season/mongo"
	localstorage "ps/internal/infrastructure/storage/local"
	ocistorage "ps/internal/infrastructure/storage/oci"
	tenantMongo "ps/internal/infrastructure/tenant/mongo"
	userMongo "ps/internal/infrastructure/user/mongo"
	"ps/internal/interfaces/rest"

	"go.mongodb.org/mongo-driver/v2/mongo"
)

type App struct {
	handler       *rest.Router
	mongoClient   *mongo.Client
	cleanupCancel context.CancelFunc
}

func New(ctx context.Context, cfg config.Config) (*App, error) {
	var (
		users           userport.Repository
		tenants         tenantport.Repository
		seasons         season.Repository
		photographers   photographer.Repository
		persons         person.Repository
		clients         client.Repository
		mongoClient     *mongo.Client
		emailSender     emailport.Sender
		storageProvider storageport.Provider
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

	if cfg.StorageProvider == "oci" {
		storageProvider = ocistorage.New(ocistorage.Config{
			Namespace: cfg.OCIStorageNamespace,
			Bucket:    cfg.OCIStorageBucket,
			Region:    cfg.OCIStorageRegion,
			Endpoint:  cfg.OCIStorageEndpoint,
		})
	} else {
		storageProvider = localstorage.New(cfg.UploadPath)
	}

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
	rMongo := reportMongo.NewRepository(db)
	alMongo := auditMongo.NewRepository(db)

	if idx, ok := rMongo.(mongoinfra.Indexable); ok {
		if idxErr := idx.EnsureIndexes(ctx); idxErr != nil {
			log.Printf("[WARNING] Could not ensure report indexes: %v", idxErr)
		}
	}
	if idx, ok := alMongo.(mongoinfra.Indexable); ok {
		if idxErr := idx.EnsureIndexes(ctx); idxErr != nil {
			log.Printf("[WARNING] Could not ensure auditlog indexes: %v", idxErr)
		}
	}

	users = uMongo
	tenants = tMongo
	seasons = sMongo
	photographers = pMongo
	persons = peMongo
	clients = cMongo

	handler := rest.NewRouter(cfg, users, tenants, hasher, tokens, emailSender, seasons, photographers, persons, clients, storageProvider, rMongo, alMongo)

	workerCtx, workerCancel := context.WithCancel(context.Background())
	if handler.ReportService() != nil {
		StartReportCleanupWorker(workerCtx, handler.ReportService())
	}

	return &App{
		handler:       handler,
		mongoClient:   mongoClient,
		cleanupCancel: workerCancel,
	}, nil
}

func (a *App) Handler() *rest.Router {
	return a.handler
}

func (a *App) Close(ctx context.Context) error {
	if a.cleanupCancel != nil {
		a.cleanupCancel()
	}
	if a.mongoClient != nil {
		return a.mongoClient.Disconnect(ctx)
	}
	return nil
}

// StartReportCleanupWorker starts a lightweight daily background routine that deletes expired reports (TTL 30 days)
func StartReportCleanupWorker(ctx context.Context, reportService *reportusecase.Service) {
	go func() {
		// Wait 5 minutes initially to not overload boot on low-memory VMs
		initialTimer := time.NewTimer(5 * time.Minute)
		select {
		case <-ctx.Done():
			initialTimer.Stop()
			return
		case <-initialTimer.C:
			runReportCleanup(ctx, reportService)
		}

		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				runReportCleanup(ctx, reportService)
			}
		}
	}()
}

func runReportCleanup(ctx context.Context, reportService *reportusecase.Service) {
	if reportService == nil {
		return
	}
	purged, err := reportService.CleanupExpiredReports(ctx, 30*24*time.Hour, 50)
	if err != nil && !errors.Is(err, context.Canceled) {
		log.Printf("[REPORT-CLEANUP-WORKER] Error cleaning up expired reports: %v", err)
	} else if purged > 0 {
		log.Printf("[REPORT-CLEANUP-WORKER] Successfully cleaned up %d expired reports", purged)
	}
}
