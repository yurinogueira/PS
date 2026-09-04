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
	TypePaidClientsCSV   ReportType = "paid_clients_csv"
	TypeUnpaidClientsCSV ReportType = "unpaid_clients_csv"
	TypeClientsPDF       ReportType = "clients_pdf"
	TypeDynamicPayment   ReportType = "dynamic_payment"
)

type ReportFilters struct {
	IsPaid         *bool    `json:"is_paid,omitempty" bson:"is_paid,omitempty"`
	PaymentMethods []string `json:"payment_methods,omitempty" bson:"payment_methods,omitempty"`
}

type UserSummary struct {
	UserID    string `json:"user_id,omitempty" bson:"user_id,omitempty"`
	UserName  string `json:"user_name,omitempty" bson:"user_name,omitempty"`
	UserEmail string `json:"user_email,omitempty" bson:"user_email,omitempty"`
}

type ReportJob struct {
	ID          string         `json:"id" bson:"_id,omitempty"`
	TenantID    string         `json:"tenant_id" bson:"tenant_id"`
	SeasonID    string         `json:"season_id,omitempty" bson:"season_id,omitempty"`
	SeasonName  string         `json:"season_name,omitempty" bson:"season_name,omitempty"`
	Type        ReportType     `json:"type" bson:"type"`
	Status      Status         `json:"status" bson:"status"`
	Filters     *ReportFilters `json:"filters,omitempty" bson:"filters,omitempty"`
	RequestedBy UserSummary    `json:"requested_by" bson:"requested_by"`
	FilePath    string         `json:"file_path,omitempty" bson:"file_path,omitempty"`
	UserEmail   string         `json:"user_email,omitempty" bson:"user_email,omitempty"`
	UserName    string         `json:"user_name,omitempty" bson:"user_name,omitempty"`
	Error       string         `json:"error,omitempty" bson:"error,omitempty"`
	CreatedAt   time.Time      `json:"created_at" bson:"created_at"`
	CompletedAt *time.Time     `json:"completed_at,omitempty" bson:"completed_at,omitempty"`
	DurationMS  int64          `json:"duration_ms,omitempty" bson:"duration_ms,omitempty"`
}
