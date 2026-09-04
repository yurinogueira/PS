package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	portauth "ps/internal/application/ports/auth"
	userport "ps/internal/application/ports/user"
	auditusecase "ps/internal/application/usecase/auditlog"
	userusecase "ps/internal/application/usecase/user"
	"ps/internal/shared/httpx"
)

type UserHandler struct {
	service *userusecase.Service
	tokens  portauth.TokenService
}

func NewUserHandler(users userport.Repository, dummy interface{}, hasher portauth.PasswordHasher, tokens portauth.TokenService) *UserHandler {
	return &UserHandler{
		service: userusecase.NewService(users, nil, hasher),
		tokens:  tokens,
	}
}

func (h *UserHandler) WithAuditor(auditor *auditusecase.Service) *UserHandler {
	if h.service != nil {
		h.service.WithAuditor(auditor)
	}
	return h
}

type UpdateProfileRequest struct {
	Name string `json:"name" example:"Yuri Nogueira"`
}

type UpdatePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" example:"senhaAntiga123"`
	NewPassword     string `json:"newPassword" example:"senhaNova12345"`
}

func (h *UserHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	userID := h.extractUserID(r)
	if userID == "" {
		httpx.Error(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}
	profile, err := h.service.GetProfile(r.Context(), userID)
	if err != nil {
		handleUserError(w, err)
		return
	}
	httpx.Success(w, map[string]any{
		"user": map[string]any{
			"id":              profile.User.ID,
			"name":            profile.User.Name,
			"email":           profile.User.Email,
			"emailVerified":   profile.User.EmailVerified,
			"emailVerifiedAt": profile.User.EmailVerifiedAt,
			"createdAt":       profile.User.CreatedAt,
			"updatedAt":       profile.User.UpdatedAt,
		},
	})
}

func (h *UserHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID := h.extractUserID(r)
	if userID == "" {
		httpx.Error(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}
	var input UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		handleUserError(w, err)
		return
	}
	updated, err := h.service.UpdateProfile(r.Context(), userID, input.Name)
	if err != nil {
		handleUserError(w, err)
		return
	}
	httpx.Success(w, map[string]any{
		"user": map[string]any{
			"id":              updated.ID,
			"name":            updated.Name,
			"email":           updated.Email,
			"emailVerified":   updated.EmailVerified,
			"emailVerifiedAt": updated.EmailVerifiedAt,
			"createdAt":       updated.CreatedAt,
			"updatedAt":       updated.UpdatedAt,
		},
	})
}

func (h *UserHandler) UpdatePassword(w http.ResponseWriter, r *http.Request) {
	userID := h.extractUserID(r)
	if userID == "" {
		httpx.Error(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}
	var input UpdatePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		handleUserError(w, err)
		return
	}
	if err := h.service.UpdatePassword(r.Context(), userID, input.CurrentPassword, input.NewPassword); err != nil {
		handleUserError(w, err)
		return
	}
	httpx.Success(w, map[string]string{
		"message": "Senha alterada com sucesso.",
	})
}

func (h *UserHandler) extractUserID(r *http.Request) string {
	token := ""
	if cookie, err := r.Cookie("ps_access_token"); err == nil && cookie.Value != "" {
		token = cookie.Value
	} else if bearer := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer "); bearer != "" && bearer != r.Header.Get("Authorization") {
		token = bearer
	}
	if token == "" {
		return ""
	}
	claims, err := h.tokens.ParseAccessToken(token)
	if err != nil {
		return ""
	}
	return claims.UserID
}

func handleUserError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, userusecase.ErrInvalidCurrentPassword):
		httpx.Error(w, http.StatusBadRequest, "Senha atual incorreta", nil)
	case errors.Is(err, userusecase.ErrWeakPassword):
		httpx.Error(w, http.StatusBadRequest, "A nova senha deve conter entre 8 e 72 caracteres", nil)
	case errors.Is(err, userusecase.ErrInvalidInput):
		httpx.Error(w, http.StatusBadRequest, "Dados inválidos: verifique os campos informados", nil)
	case errors.Is(err, userusecase.ErrUserNotFound):
		httpx.Error(w, http.StatusNotFound, "Usuário não encontrado", nil)
	default:
		httpx.Error(w, http.StatusInternalServerError, "Erro inesperado", nil)
	}
}
