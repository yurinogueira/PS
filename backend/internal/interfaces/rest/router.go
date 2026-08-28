package rest

import (
	"net/http"

	_ "ps/docs"
	portauth "ps/internal/application/ports/auth"
	emailport "ps/internal/application/ports/email"
	userport "ps/internal/application/ports/user"
	"ps/internal/config"
	"ps/internal/interfaces/rest/handlers"
	"ps/internal/shared/httpx"
	"ps/internal/shared/middleware"

	"ps/internal/application/ports/client"
	"ps/internal/application/ports/person"
	"ps/internal/application/ports/photographer"
	"ps/internal/application/ports/season"
	clientusecase "ps/internal/application/usecase/client"
	personusecase "ps/internal/application/usecase/person"
	photographerusecase "ps/internal/application/usecase/photographer"
	seasonusecase "ps/internal/application/usecase/season"

	httpSwagger "github.com/swaggo/http-swagger/v2"
)

type Router struct {
	handler http.Handler
}

func NewRouter(cfg config.Config, users userport.Repository, hasher portauth.PasswordHasher, tokens portauth.TokenService, emailSender emailport.Sender, seasons season.Repository, photographers photographer.Repository, persons person.Repository, clients client.Repository) *Router {
	mux := http.NewServeMux()
	healthHandler := handlers.NewHealthHandler()
	authHandler := handlers.NewAuthHandler(users, hasher, tokens, emailSender, cfg.CookieDomain, cfg.CookieSecure)
	userHandler := handlers.NewUserHandler(users, nil, hasher, tokens)

	seasonSvc := seasonusecase.NewService(seasons)
	photographerSvc := photographerusecase.NewService(photographers)
	personSvc := personusecase.NewService(persons)
	clientSvc := clientusecase.NewService(clients)

	seasonHandler := handlers.NewSeasonHandler(seasonSvc)
	photographerHandler := handlers.NewPhotographerHandler(photographerSvc)
	personHandler := handlers.NewPersonHandler(personSvc)
	clientHandler := handlers.NewSeasonClientHandler(clientSvc)

	// Rate limiters
	globalLimiter := middleware.NewRateLimiter(100.0/60.0, 100, cfg.TrustedProxies...)
	authLimiter := middleware.NewRateLimiter(10.0/60.0, 10, cfg.TrustedProxies...)

	if cfg.LogLevel == "debug" {
		mux.Handle("/swagger/", httpSwagger.WrapHandler)
	}

	mux.Handle("GET /health", middleware.Chain(healthHandler.Health(), middleware.RequestID, middleware.StructuredLogging(cfg.LogLevel)))
	mux.Handle("GET /ready", middleware.Chain(healthHandler.Ready(), middleware.RequestID, middleware.StructuredLogging(cfg.LogLevel)))
	mux.Handle("GET /live", middleware.Chain(healthHandler.Live(), middleware.RequestID, middleware.StructuredLogging(cfg.LogLevel)))

	mux.Handle("GET /api/v1", middleware.Chain(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		httpx.Success(w, map[string]string{"version": "v1"})
	}), middleware.RequestID, middleware.StructuredLogging(cfg.LogLevel)))

	authChain := func(h http.HandlerFunc) http.Handler {
		return authLimiter.Limit(middleware.Chain(h, middleware.RequestID, middleware.StructuredLogging(cfg.LogLevel)))
	}

	mux.Handle("POST /api/v1/auth/register", authChain(authHandler.Register))
	mux.Handle("POST /api/v1/auth/login", authChain(authHandler.Login))
	mux.Handle("POST /api/v1/auth/forgot-password", authChain(authHandler.ForgotPassword))
	mux.Handle("POST /api/v1/auth/reset-password", authChain(authHandler.ResetPassword))
	mux.Handle("POST /api/v1/auth/verify-email", authChain(authHandler.VerifyEmail))
	mux.Handle("POST /api/v1/auth/resend-verification", authChain(authHandler.ResendVerification))
	mux.Handle("POST /api/v1/auth/refresh", middleware.Chain(http.HandlerFunc(authHandler.Refresh), middleware.RequestID, middleware.StructuredLogging(cfg.LogLevel)))
	mux.Handle("GET /api/v1/auth/me", middleware.Chain(http.HandlerFunc(authHandler.Me), middleware.RequestID, middleware.StructuredLogging(cfg.LogLevel)))
	mux.Handle("POST /api/v1/auth/logout", middleware.Chain(http.HandlerFunc(authHandler.Logout), middleware.RequestID, middleware.StructuredLogging(cfg.LogLevel)))

	// Protected routes wrapper (requires authentication)
	protectedChain := func(h http.HandlerFunc) http.Handler {
		return middleware.Chain(h, middleware.Auth(tokens), middleware.RequestID, middleware.StructuredLogging(cfg.LogLevel))
	}

	// Business routes wrapper (requires authentication + tenant)
	businessChain := func(h http.HandlerFunc) http.Handler {
		return middleware.Chain(h, middleware.Auth(tokens), middleware.RequireTenant(), middleware.RequestID, middleware.StructuredLogging(cfg.LogLevel))
	}

	mux.Handle("GET /api/v1/user/profile", protectedChain(userHandler.GetProfile))
	mux.Handle("PUT /api/v1/user/profile", protectedChain(userHandler.UpdateProfile))
	mux.Handle("PUT /api/v1/user/password", protectedChain(userHandler.UpdatePassword))

	mux.Handle("GET /api/v1/seasons", businessChain(seasonHandler.List))
	mux.Handle("POST /api/v1/seasons", businessChain(seasonHandler.Create))
	mux.Handle("GET /api/v1/photographers", businessChain(photographerHandler.List))
	mux.Handle("POST /api/v1/photographers", businessChain(photographerHandler.Create))

	mux.Handle("GET /api/v1/people", businessChain(personHandler.List))
	mux.Handle("POST /api/v1/people", businessChain(personHandler.Create))
	mux.Handle("GET /api/v1/people/{id}", businessChain(personHandler.GetByID))
	mux.Handle("PUT /api/v1/people/{id}", businessChain(personHandler.Update))
	mux.Handle("DELETE /api/v1/people/{id}", businessChain(personHandler.Delete))

	mux.Handle("GET /api/v1/clients", businessChain(clientHandler.List))
	mux.Handle("POST /api/v1/clients", businessChain(clientHandler.Create))
	mux.Handle("GET /api/v1/clients/{id}", businessChain(clientHandler.GetByID))
	mux.Handle("PUT /api/v1/clients/{id}", businessChain(clientHandler.Update))
	mux.Handle("DELETE /api/v1/clients/{id}", businessChain(clientHandler.Delete))

	handler := middleware.SecurityHeaders(
		middleware.CORS(
			globalLimiter.Limit(
				middleware.BodyLimit(1<<20)(mux),
			),
			cfg.AllowedOrigins,
		),
	)

	return &Router{handler: handler}
}

func (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	r.handler.ServeHTTP(w, req)
}
