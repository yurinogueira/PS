package auth

import "ps/internal/domain/user"

type TokenPair struct {
	AccessToken  string
	RefreshToken string
}

type TokenClaims struct {
	UserID     string
	Email      string
	TenantID   string
	SuperAdmin bool
}

type TokenService interface {
	GeneratePair(user user.User) (TokenPair, error)
	GenerateAccessToken(user user.User) (string, error)
	GenerateRefreshToken(userID string) (string, error)
	ParseAccessToken(token string) (TokenClaims, error)
	ParseRefreshToken(token string) (TokenClaims, error)
}
