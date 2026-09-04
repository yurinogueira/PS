package auditlog

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"log"
	"reflect"
	"strings"
	"time"

	auditport "ps/internal/application/ports/auditlog"
	domainaudit "ps/internal/domain/auditlog"
	"ps/internal/shared/authctx"
)

type Entry struct {
	TenantID   string
	EntityType domainaudit.EntityType
	EntityID   string
	UserID     string
	UserEmail  string
	Action     domainaudit.Action
	Changes    []domainaudit.Change
}

type Service struct {
	repo auditport.Repository
}

func NewService(repo auditport.Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) List(ctx context.Context, filter auditport.Filter) (auditport.PaginatedResult, error) {
	return s.repo.List(ctx, filter)
}

func (s *Service) Record(ctx context.Context, entry Entry) {
	if s == nil || s.repo == nil {
		return
	}

	auditLog := s.buildAuditLog(ctx, entry)

	// Resilient execution: log errors but do not fail parent workflow
	go func(logItem domainaudit.AuditLog) {
		bgCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := s.repo.Create(bgCtx, &logItem); err != nil {
			log.Printf("[AUDIT-LOG-ERROR] Failed to persist audit log for entity %s/%s: %v", logItem.EntityType, logItem.EntityID, err)
		}
	}(auditLog)
}

func (s *Service) RecordSync(ctx context.Context, entry Entry) error {
	if s == nil || s.repo == nil {
		return nil
	}
	auditLog := s.buildAuditLog(ctx, entry)
	return s.repo.Create(ctx, &auditLog)
}

func (s *Service) RecordMutation(ctx context.Context, tenantID string, entityType domainaudit.EntityType, entityID string, action domainaudit.Action, oldEntity, newEntity any) {
	changes := Diff(oldEntity, newEntity)
	s.Record(ctx, Entry{
		TenantID:   tenantID,
		EntityType: entityType,
		EntityID:   entityID,
		Action:     action,
		Changes:    changes,
	})
}

func (s *Service) RecordMutationSync(ctx context.Context, tenantID string, entityType domainaudit.EntityType, entityID string, action domainaudit.Action, oldEntity, newEntity any) error {
	changes := Diff(oldEntity, newEntity)
	return s.RecordSync(ctx, Entry{
		TenantID:   tenantID,
		EntityType: entityType,
		EntityID:   entityID,
		Action:     action,
		Changes:    changes,
	})
}

func (s *Service) buildAuditLog(ctx context.Context, entry Entry) domainaudit.AuditLog {
	userID := entry.UserID
	if userID == "" && ctx != nil {
		userID = authctx.GetUserID(ctx)
	}

	userEmail := entry.UserEmail
	if userEmail == "" && ctx != nil {
		userEmail = authctx.GetUserEmail(ctx)
	}

	tenantID := entry.TenantID
	if tenantID == "" && ctx != nil {
		tenantID = authctx.GetTenantID(ctx)
	}

	id := generateRandomHex(12)
	now := time.Now().UTC()

	changes := entry.Changes
	if changes == nil {
		changes = []domainaudit.Change{}
	}

	return domainaudit.AuditLog{
		ID:         id,
		TenantID:   tenantID,
		EntityType: entry.EntityType,
		EntityID:   entry.EntityID,
		UserID:     userID,
		UserEmail:  userEmail,
		Action:     entry.Action,
		Changes:    changes,
		CreatedAt:  now,
	}
}

func generateRandomHex(n int) string {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return hex.EncodeToString([]byte(time.Now().Format("20060102150405.000000")))
	}
	return hex.EncodeToString(b)
}

// Diff compares two entities and returns changes, omitting sensitive fields.
func Diff(oldEntity, newEntity any) []domainaudit.Change {
	oldMap := toMap(oldEntity)
	newMap := toMap(newEntity)

	if oldMap == nil && newMap == nil {
		return []domainaudit.Change{}
	}

	changes := make([]domainaudit.Change, 0)

	// If old is nil, this is a CREATE
	if oldMap == nil {
		for k, v := range newMap {
			if isSensitiveField(k) {
				continue
			}
			changes = append(changes, domainaudit.Change{
				FieldChanged: k,
				OldValue:     nil,
				NewValue:     v,
			})
		}
		return changes
	}

	// If new is nil, this is a DELETE
	if newMap == nil {
		for k, v := range oldMap {
			if isSensitiveField(k) {
				continue
			}
			changes = append(changes, domainaudit.Change{
				FieldChanged: k,
				OldValue:     v,
				NewValue:     nil,
			})
		}
		return changes
	}

	// Compare both maps (UPDATE)
	allKeys := make(map[string]bool)
	for k := range oldMap {
		allKeys[k] = true
	}
	for k := range newMap {
		allKeys[k] = true
	}

	for k := range allKeys {
		if isSensitiveField(k) {
			continue
		}
		vOld, hasOld := oldMap[k]
		vNew, hasNew := newMap[k]

		if !hasOld && hasNew {
			changes = append(changes, domainaudit.Change{
				FieldChanged: k,
				OldValue:     nil,
				NewValue:     vNew,
			})
		} else if hasOld && !hasNew {
			changes = append(changes, domainaudit.Change{
				FieldChanged: k,
				OldValue:     vOld,
				NewValue:     nil,
			})
		} else if !reflect.DeepEqual(vOld, vNew) {
			changes = append(changes, domainaudit.Change{
				FieldChanged: k,
				OldValue:     vOld,
				NewValue:     vNew,
			})
		}
	}

	return changes
}

func isSensitiveField(fieldName string) bool {
	lower := strings.ToLower(fieldName)
	return strings.Contains(lower, "password") ||
		strings.Contains(lower, "hash") ||
		strings.Contains(lower, "token") ||
		strings.Contains(lower, "secret")
}

func toMap(v any) map[string]any {
	if v == nil {
		return nil
	}

	val := reflect.ValueOf(v)
	if val.Kind() == reflect.Ptr {
		if val.IsNil() {
			return nil
		}
		val = val.Elem()
	}

	if val.Kind() == reflect.Map {
		res := make(map[string]any)
		for _, k := range val.MapKeys() {
			kStr := k.String()
			res[kStr] = val.MapIndex(k).Interface()
		}
		return res
	}

	if val.Kind() != reflect.Struct {
		return nil
	}

	t := val.Type()
	res := make(map[string]any)

	for i := 0; i < t.NumField(); i++ {
		sf := t.Field(i)
		if sf.PkgPath != "" {
			// unexported field
			continue
		}

		jsonTag := sf.Tag.Get("json")
		if jsonTag == "-" {
			continue
		}

		fieldName := sf.Name
		if jsonTag != "" {
			parts := strings.Split(jsonTag, ",")
			if parts[0] != "" {
				fieldName = parts[0]
			}
		}

		fVal := val.Field(i)
		res[fieldName] = fVal.Interface()
	}

	return res
}
