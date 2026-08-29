package config

import (
	"errors"
	"fmt"
	"log"
	"os"
	"strings"
)

const MinSecretLength = 32

var (
	ErrJWTSecretEmpty           = errors.New("JWT_SECRET must not be empty")
	ErrJWTRefreshSecretEmpty    = errors.New("JWT_REFRESH_SECRET must not be empty")
	ErrJWTSecretInsecure        = errors.New("JWT_SECRET cannot be a known insecure default value")
	ErrJWTRefreshSecretInsecure = errors.New("JWT_REFRESH_SECRET cannot be a known insecure default value")
	ErrJWTSecretTooShort        = fmt.Errorf("JWT_SECRET must be at least %d characters long", MinSecretLength)
	ErrJWTRefreshSecretTooShort = fmt.Errorf("JWT_REFRESH_SECRET must be at least %d characters long", MinSecretLength)
	ErrJWTSecretsIdentical      = errors.New("JWT_SECRET and JWT_REFRESH_SECRET must be different")
)

var insecureDefaultSecrets = map[string]struct{}{
	"change-me":     {},
	"change-me-too": {},
}

type Config struct {
	Port                string
	JWTSecret           string
	JWTRefreshSecret    string
	MongoURI            string
	MongoDatabase       string
	UploadPath          string
	LogLevel            string
	StorageProvider     string
	OCIStorageBucket    string
	OCIStorageNamespace string
	OCIStorageRegion    string
	OCIStorageEndpoint  string
	AllowedOrigins      []string
	TrustedProxies      []string
	CookieDomain        string
	CookieSecure        bool
	AppBaseURL          string
	SMTPHost            string
	SMTPPort            string
	SMTPUser            string
	SMTPPass            string
	EmailFrom           string
}

func (c Config) Validate() error {
	if c.JWTSecret == "" {
		return ErrJWTSecretEmpty
	}
	if _, ok := insecureDefaultSecrets[c.JWTSecret]; ok {
		return ErrJWTSecretInsecure
	}
	if len(c.JWTSecret) < MinSecretLength {
		return ErrJWTSecretTooShort
	}

	if c.JWTRefreshSecret == "" {
		return ErrJWTRefreshSecretEmpty
	}
	if _, ok := insecureDefaultSecrets[c.JWTRefreshSecret]; ok {
		return ErrJWTRefreshSecretInsecure
	}
	if len(c.JWTRefreshSecret) < MinSecretLength {
		return ErrJWTRefreshSecretTooShort
	}

	if c.JWTSecret == c.JWTRefreshSecret {
		return ErrJWTSecretsIdentical
	}

	return nil
}

func Load() Config {
	cfg := Config{
		Port:                getenv("PORT", "8080"),
		JWTSecret:           getenv("JWT_SECRET", ""),
		JWTRefreshSecret:    getenv("JWT_REFRESH_SECRET", ""),
		MongoURI:            getenv("MONGO_URI", "mongodb://localhost:27017"),
		MongoDatabase:       getenv("MONGO_DATABASE", "ps"),
		UploadPath:          getenv("UPLOAD_PATH", "./data/uploads"),
		LogLevel:            getenv("LOG_LEVEL", "info"),
		StorageProvider:     getenv("STORAGE_PROVIDER", "local"),
		OCIStorageBucket:    getenv("OCI_STORAGE_BUCKET", "ps-files"),
		OCIStorageNamespace: getenv("OCI_STORAGE_NAMESPACE", ""),
		OCIStorageRegion:    getenv("OCI_STORAGE_REGION", "sa-saopaulo-1"),
		OCIStorageEndpoint:  getenv("OCI_STORAGE_ENDPOINT", ""),
		AllowedOrigins:      parseCommaSeparated(getenv("ALLOWED_ORIGINS", "http://localhost:5173")),
		TrustedProxies:      parseCommaSeparated(getenv("TRUSTED_PROXIES", "127.0.0.1,::1")),
		CookieDomain:        getenv("COOKIE_DOMAIN", ""),
		CookieSecure:        getenv("COOKIE_SECURE", "true") == "true",
		AppBaseURL:          getenv("APP_BASE_URL", "http://localhost:5173"),
		SMTPHost:            getenv("SMTP_HOST", ""),
		SMTPPort:            getenv("SMTP_PORT", "587"),
		SMTPUser:            getenv("SMTP_USER", ""),
		SMTPPass:            getenv("SMTP_PASS", ""),
		EmailFrom:           getenv("EMAIL_FROM", "no-reply@ps.com.br"),
	}

	if err := cfg.Validate(); err != nil {
		log.Fatalf("FATAL: invalid configuration: %v", err)
	}

	return cfg
}

func (c Config) HTTPAddress() string {
	return ":" + c.Port
}

func getenv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func parseCommaSeparated(raw string) []string {
	var items []string
	for _, item := range strings.Split(raw, ",") {
		item = strings.TrimSpace(item)
		if item != "" {
			items = append(items, item)
		}
	}
	return items
}
