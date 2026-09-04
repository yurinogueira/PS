package user

import "time"

type Role string

const (
	RoleAdmin   Role = "admin"
	RoleManager Role = "manager"
	RoleUser    Role = "user"
)

type User struct {
	ID                         string     `json:"id"`
	Name                       string     `json:"name"`
	Email                      string     `json:"email"`
	PasswordHash               string     `json:"-"`
	EmailVerified              bool       `json:"emailVerified"`
	EmailVerifiedAt            *time.Time `json:"emailVerifiedAt,omitempty"`
	EmailVerificationTokenHash string     `json:"-"`
	EmailVerificationExpiresAt *time.Time `json:"-"`
	PasswordResetTokenHash     string     `json:"-"`
	PasswordResetExpiresAt     *time.Time `json:"-"`
	TenantID                   string     `json:"tenantId"`
	SuperAdmin                 bool       `json:"superAdmin"`
	Role                       Role       `json:"role"`
	CreatedAt                  time.Time  `json:"createdAt"`
	UpdatedAt                  time.Time  `json:"updatedAt,omitempty"`
}

func (u User) GetRole() Role {
	if u.Role != "" {
		return u.Role
	}
	if u.SuperAdmin {
		return RoleAdmin
	}
	return RoleUser
}
