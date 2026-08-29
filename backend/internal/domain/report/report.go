package report

import "time"

type Status string

const (
	StatusPending    Status = "pending"
	StatusProcessing Status = "processing"
	StatusCompleted  Status = "completed"
	StatusFailed     Status = "failed"
)

type ReportType string

const (
	TypeClientsCSV       ReportType = "clients_csv"
	TypeUnpaidClientsCSV ReportType = "unpaid_clients_csv"
	TypeClientsPDF       ReportType = "clients_pdf"
)

type ReportJob struct {
	ID          string     `json:"id" bson:"_id,omitempty"`
	TenantID    string     `json:"tenant_id" bson:"tenant_id"`
	Type        ReportType `json:"type" bson:"type"`
	Status      Status     `json:"status" bson:"status"`
	FilePath    string     `json:"file_path,omitempty" bson:"file_path,omitempty"`
	UserEmail   string     `json:"user_email" bson:"user_email"`
	UserName    string     `json:"user_name" bson:"user_name"`
	Error       string     `json:"error,omitempty" bson:"error,omitempty"`
	CreatedAt   time.Time  `json:"created_at" bson:"created_at"`
	CompletedAt *time.Time `json:"completed_at,omitempty" bson:"completed_at,omitempty"`
}
