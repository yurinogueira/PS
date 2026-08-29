package config

import (
	"errors"
	"os"
	"strings"
	"testing"
)

func TestConfig_Validate(t *testing.T) {
	validSecret1 := strings.Repeat("a", 32)
	validSecret2 := strings.Repeat("b", 32)

	tests := []struct {
		name        string
		cfg         Config
		wantErr     error
		wantErrText string
	}{
		{
			name: "valid configuration",
			cfg: Config{
				JWTSecret:        validSecret1,
				JWTRefreshSecret: validSecret2,
			},
			wantErr: nil,
		},
		{
			name: "empty JWTSecret",
			cfg: Config{
				JWTSecret:        "",
				JWTRefreshSecret: validSecret2,
			},
			wantErr: ErrJWTSecretEmpty,
		},
		{
			name: "insecure default JWTSecret change-me",
			cfg: Config{
				JWTSecret:        "change-me",
				JWTRefreshSecret: validSecret2,
			},
			wantErr: ErrJWTSecretInsecure,
		},
		{
			name: "too short JWTSecret (<32 chars)",
			cfg: Config{
				JWTSecret:        "short-secret-12345",
				JWTRefreshSecret: validSecret2,
			},
			wantErr: ErrJWTSecretTooShort,
		},
		{
			name: "empty JWTRefreshSecret",
			cfg: Config{
				JWTSecret:        validSecret1,
				JWTRefreshSecret: "",
			},
			wantErr: ErrJWTRefreshSecretEmpty,
		},
		{
			name: "insecure default JWTRefreshSecret change-me-too",
			cfg: Config{
				JWTSecret:        validSecret1,
				JWTRefreshSecret: "change-me-too",
			},
			wantErr: ErrJWTRefreshSecretInsecure,
		},
		{
			name: "too short JWTRefreshSecret (<32 chars)",
			cfg: Config{
				JWTSecret:        validSecret1,
				JWTRefreshSecret: "short-refresh-secret-12345",
			},
			wantErr: ErrJWTRefreshSecretTooShort,
		},
		{
			name: "identical secrets",
			cfg: Config{
				JWTSecret:        validSecret1,
				JWTRefreshSecret: validSecret1,
			},
			wantErr: ErrJWTSecretsIdentical,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.cfg.Validate()
			if tt.wantErr == nil {
				if err != nil {
					t.Fatalf("expected no error, got: %v", err)
				}
			} else {
				if err == nil {
					t.Fatalf("expected error %v, got nil", tt.wantErr)
				}
				if !errors.Is(err, tt.wantErr) && err.Error() != tt.wantErr.Error() {
					t.Fatalf("expected error %v, got: %v", tt.wantErr, err)
				}
			}
		})
	}
}

func TestConfig_Load_Success(t *testing.T) {
	secret1 := "12345678901234567890123456789012"
	secret2 := "abcdefghijklmnopqrstuvwxyz123456"

	t.Setenv("JWT_SECRET", secret1)
	t.Setenv("JWT_REFRESH_SECRET", secret2)
	t.Setenv("PORT", "9090")
	t.Setenv("LOG_LEVEL", "debug")
	t.Setenv("ALLOWED_ORIGINS", "http://localhost:3000, https://app.example.com")
	t.Setenv("TRUSTED_PROXIES", "10.0.0.1, 10.0.0.2")
	t.Setenv("COOKIE_SECURE", "false")

	cfg := Load()

	if cfg.Port != "9090" {
		t.Errorf("expected Port '9090', got %q", cfg.Port)
	}
	if cfg.HTTPAddress() != ":9090" {
		t.Errorf("expected HTTPAddress ':9090', got %q", cfg.HTTPAddress())
	}
	if cfg.JWTSecret != secret1 {
		t.Errorf("expected JWTSecret %q, got %q", secret1, cfg.JWTSecret)
	}
	if cfg.JWTRefreshSecret != secret2 {
		t.Errorf("expected JWTRefreshSecret %q, got %q", secret2, cfg.JWTRefreshSecret)
	}
	if cfg.LogLevel != "debug" {
		t.Errorf("expected LogLevel 'debug', got %q", cfg.LogLevel)
	}
	if cfg.CookieSecure != false {
		t.Errorf("expected CookieSecure false, got %v", cfg.CookieSecure)
	}
	if len(cfg.AllowedOrigins) != 2 || cfg.AllowedOrigins[0] != "http://localhost:3000" || cfg.AllowedOrigins[1] != "https://app.example.com" {
		t.Errorf("unexpected AllowedOrigins: %v", cfg.AllowedOrigins)
	}
	if len(cfg.TrustedProxies) != 2 || cfg.TrustedProxies[0] != "10.0.0.1" || cfg.TrustedProxies[1] != "10.0.0.2" {
		t.Errorf("unexpected TrustedProxies: %v", cfg.TrustedProxies)
	}
}

func TestGetenv_Fallback(t *testing.T) {
	key := "NON_EXISTENT_VAR_FOR_TEST_123"
	_ = os.Unsetenv(key)
	got := getenv(key, "default_val")
	if got != "default_val" {
		t.Errorf("expected 'default_val', got %q", got)
	}
}

func TestParseCommaSeparated(t *testing.T) {
	got := parseCommaSeparated(" foo, bar, , baz , ")
	expected := []string{"foo", "bar", "baz"}
	if len(got) != len(expected) {
		t.Fatalf("expected %v items, got %v", len(expected), len(got))
	}
	for i := range got {
		if got[i] != expected[i] {
			t.Errorf("at index %d: expected %q, got %q", i, expected[i], got[i])
		}
	}
}
