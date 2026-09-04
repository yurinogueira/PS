package auditlog

import "time"

type Action string

const (
	ActionCreate       Action = "CREATE"
	ActionUpdate       Action = "UPDATE"
	ActionDelete       Action = "DELETE"
	ActionRoleChange   Action = "ROLE_CHANGE"
	ActionAssignTenant Action = "ASSIGN_TENANT"
)

type EntityType string

const (
	EntityUser         EntityType = "user"
	EntityTenant       EntityType = "tenant"
	EntitySeason       EntityType = "season"
	EntityPhotographer EntityType = "photographer"
	EntityPerson       EntityType = "person"
	EntityClient       EntityType = "client"
)

type Change struct {
	FieldChanged string `json:"fieldChanged" bson:"field_changed"`
	OldValue     any    `json:"oldValue" bson:"old_value"`
	NewValue     any    `json:"newValue" bson:"new_value"`
}

type AuditLog struct {
	ID         string     `json:"id" bson:"_id"`
	TenantID   string     `json:"tenantId,omitempty" bson:"tenant_id,omitempty"`
	EntityType EntityType `json:"entityType" bson:"entity_type"`
	EntityID   string     `json:"entityId" bson:"entity_id"`
	UserID     string     `json:"userId" bson:"user_id"`
	UserEmail  string     `json:"userEmail" bson:"user_email"`
	Action     Action     `json:"action" bson:"action"`
	Changes    []Change   `json:"changes" bson:"changes"`
	CreatedAt  time.Time  `json:"createdAt" bson:"created_at"`
}
