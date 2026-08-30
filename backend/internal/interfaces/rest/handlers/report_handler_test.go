package handlers_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	storageport "ps/internal/application/ports/storage"
	reportusecase "ps/internal/application/usecase/report"
	clientdomain "ps/internal/domain/client"
	persondomain "ps/internal/domain/person"
	photographerdomain "ps/internal/domain/photographer"
	domainuser "ps/internal/domain/user"
	usermemory "ps/internal/infrastructure/user/memory"
	"ps/internal/interfaces/rest/handlers"
	"ps/internal/shared/middleware"
)

type mockReportClientRepo struct {
	clients []*clientdomain.SeasonClient
}

func (m *mockReportClientRepo) Create(ctx context.Context, client *clientdomain.SeasonClient) error {
	return nil
}
func (m *mockReportClientRepo) GetByID(ctx context.Context, id, tenantID string) (*clientdomain.SeasonClient, error) {
	return nil, nil
}
func (m *mockReportClientRepo) List(ctx context.Context, tenantID string, filter clientdomain.ListFilter) (*clientdomain.PaginatedClients, error) {
	return &clientdomain.PaginatedClients{
		Data:  m.clients,
		Total: int64(len(m.clients)),
	}, nil
}
func (m *mockReportClientRepo) StreamByTenant(ctx context.Context, tenantID, seasonID string, fn func(c *clientdomain.SeasonClient) error) error {
	for _, c := range m.clients {
		if c.TenantID == tenantID && (seasonID == "" || c.SeasonID == seasonID) {
			if err := fn(c); err != nil {
				return err
			}
		}
	}
	return nil
}
func (m *mockReportClientRepo) Update(ctx context.Context, client *clientdomain.SeasonClient) error {
	return nil
}
func (m *mockReportClientRepo) Delete(ctx context.Context, id, tenantID string) error {
	return nil
}
func (m *mockReportClientRepo) CountBySeason(ctx context.Context, tenantID, seasonID string) (int64, error) {
	var count int64
	for _, c := range m.clients {
		if c.TenantID == tenantID && (seasonID == "" || c.SeasonID == seasonID) {
			count++
		}
	}
	return count, nil
}
func (m *mockReportClientRepo) MaxClientsPerSeason(ctx context.Context, tenantID string) (int64, error) {
	counts := make(map[string]int64)
	for _, c := range m.clients {
		if c.TenantID == tenantID {
			counts[c.SeasonID]++
		}
	}
	var maxCount int64
	for _, cnt := range counts {
		if cnt > maxCount {
			maxCount = cnt
		}
	}
	return maxCount, nil
}
func (m *mockReportClientRepo) DeleteBySeasonID(ctx context.Context, seasonID, tenantID string) error {
	return nil
}

type mockReportPersonRepo struct {
	people map[string]*persondomain.Person
}

func (m *mockReportPersonRepo) Create(ctx context.Context, person *persondomain.Person) error {
	return nil
}
func (m *mockReportPersonRepo) GetByID(ctx context.Context, id, tenantID string) (*persondomain.Person, error) {
	if p, ok := m.people[id]; ok {
		return p, nil
	}
	return nil, nil
}
func (m *mockReportPersonRepo) List(ctx context.Context, tenantID string) ([]*persondomain.Person, error) {
	return nil, nil
}
func (m *mockReportPersonRepo) Update(ctx context.Context, person *persondomain.Person) error {
	return nil
}
func (m *mockReportPersonRepo) Delete(ctx context.Context, id, tenantID string) error {
	return nil
}

type mockReportPhotographerRepo struct{}

func (m *mockReportPhotographerRepo) Create(ctx context.Context, photographer *photographerdomain.Photographer) error {
	return nil
}
func (m *mockReportPhotographerRepo) GetByID(ctx context.Context, id, tenantID string) (*photographerdomain.Photographer, error) {
	return nil, nil
}
func (m *mockReportPhotographerRepo) List(ctx context.Context, tenantID string) ([]*photographerdomain.Photographer, error) {
	return nil, nil
}
func (m *mockReportPhotographerRepo) Update(ctx context.Context, photographer *photographerdomain.Photographer) error {
	return nil
}
func (m *mockReportPhotographerRepo) Delete(ctx context.Context, id, tenantID string) error {
	return nil
}

type mockReportStorageProvider struct {
	files map[string][]byte
}

func (m *mockReportStorageProvider) Save(ctx context.Context, path string, file storageport.File) (storageport.StoredObject, error) {
	if m.files == nil {
		m.files = make(map[string][]byte)
	}
	m.files[path] = file.Data
	return storageport.StoredObject{FileName: path, Size: int64(len(file.Data))}, nil
}
func (m *mockReportStorageProvider) Get(ctx context.Context, path string) ([]byte, error) {
	if data, ok := m.files[path]; ok {
		return data, nil
	}
	return nil, nil
}
func (m *mockReportStorageProvider) Delete(ctx context.Context, path string) error {
	delete(m.files, path)
	return nil
}

type mockReportEmailSender struct{}

func (m *mockReportEmailSender) SendVerificationEmail(ctx context.Context, toEmail, toName, token string) error {
	return nil
}
func (m *mockReportEmailSender) SendPasswordResetEmail(ctx context.Context, toEmail, toName, token string) error {
	return nil
}
func (m *mockReportEmailSender) SendReportReadyEmail(ctx context.Context, toEmail, toName, reportName, downloadURL string) error {
	return nil
}

func setupReportHandler() (*handlers.ReportHandler, *mockReportStorageProvider, *usermemory.Repository) {
	clientRepo := &mockReportClientRepo{}
	personRepo := &mockReportPersonRepo{people: make(map[string]*persondomain.Person)}
	photogRepo := &mockReportPhotographerRepo{}
	storage := &mockReportStorageProvider{files: make(map[string][]byte)}
	emailSender := &mockReportEmailSender{}
	userRepo := usermemory.NewRepository()

	svc := reportusecase.NewService(clientRepo, personRepo, photogRepo, storage, emailSender, "http://localhost:8080")
	handler := handlers.NewReportHandler(svc, userRepo)
	return handler, storage, userRepo
}

func TestReportHandler_ExportEndpoints(t *testing.T) {
	handler, _, userRepo := setupReportHandler()

	u, _ := userRepo.Create(context.Background(), domainuser.User{
		Name:     "Test User",
		Email:    "test@example.com",
		TenantID: "tenant-1",
	})

	t.Run("ExportPaidClientsCSV requires tenant", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/api/v1/reports/paid-clients-csv", nil)
		rec := httptest.NewRecorder()
		handler.ExportPaidClientsCSV(rec, req)
		if rec.Code != http.StatusForbidden {
			t.Fatalf("expected 403 Forbidden without tenant, got %d", rec.Code)
		}
	})

	t.Run("ExportPaidClientsCSV success", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/api/v1/reports/paid-clients-csv?season_id=season-1", nil)
		ctx := context.WithValue(req.Context(), middleware.TenantIDKey, "tenant-1")
		ctx = context.WithValue(ctx, middleware.UserIDKey, u.ID)
		req = req.WithContext(ctx)

		rec := httptest.NewRecorder()
		handler.ExportPaidClientsCSV(rec, req)

		if rec.Code != http.StatusAccepted {
			t.Fatalf("expected 202 Accepted, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("ExportClientsCSV success", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/api/v1/reports/clients-csv", nil)
		ctx := context.WithValue(req.Context(), middleware.TenantIDKey, "tenant-1")
		ctx = context.WithValue(ctx, middleware.UserIDKey, u.ID)
		req = req.WithContext(ctx)

		rec := httptest.NewRecorder()
		handler.ExportClientsCSV(rec, req)

		if rec.Code != http.StatusAccepted {
			t.Fatalf("expected 202 Accepted, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("ExportUnpaidClientsCSV success", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/api/v1/reports/unpaid-clients-csv", nil)
		ctx := context.WithValue(req.Context(), middleware.TenantIDKey, "tenant-1")
		ctx = context.WithValue(ctx, middleware.UserIDKey, u.ID)
		req = req.WithContext(ctx)

		rec := httptest.NewRecorder()
		handler.ExportUnpaidClientsCSV(rec, req)

		if rec.Code != http.StatusAccepted {
			t.Fatalf("expected 202 Accepted, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("ExportClientsPDF success", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/api/v1/reports/clients-pdf", nil)
		ctx := context.WithValue(req.Context(), middleware.TenantIDKey, "tenant-1")
		ctx = context.WithValue(ctx, middleware.UserIDKey, u.ID)
		req = req.WithContext(ctx)

		rec := httptest.NewRecorder()
		handler.ExportClientsPDF(rec, req)

		if rec.Code != http.StatusAccepted {
			t.Fatalf("expected 202 Accepted, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("DownloadDirectClientsPDF success", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/reports/clients-pdf", nil)
		ctx := context.WithValue(req.Context(), middleware.TenantIDKey, "tenant-1")
		req = req.WithContext(ctx)

		rec := httptest.NewRecorder()
		handler.DownloadDirectClientsPDF(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d: %s", rec.Code, rec.Body.String())
		}
		if rec.Header().Get("Content-Type") != "application/pdf" {
			t.Fatalf("expected application/pdf header, got %s", rec.Header().Get("Content-Type"))
		}
	})
}

func TestReportHandler_DownloadReport(t *testing.T) {
	handler, storage, _ := setupReportHandler()

	// Store dummy file
	validPath := "reports/tenant_tenant-1/clientes_123.csv"
	storage.files[validPath] = []byte("header1,header2\nval1,val2")

	t.Run("Missing file param", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/reports/download", nil)
		ctx := context.WithValue(req.Context(), middleware.TenantIDKey, "tenant-1")
		req = req.WithContext(ctx)

		rec := httptest.NewRecorder()
		handler.DownloadReport(rec, req)

		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 Bad Request, got %d", rec.Code)
		}
	})

	t.Run("Cross-tenant access forbidden", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/reports/download?file=reports/tenant_other/secret.csv", nil)
		ctx := context.WithValue(req.Context(), middleware.TenantIDKey, "tenant-1")
		req = req.WithContext(ctx)

		rec := httptest.NewRecorder()
		handler.DownloadReport(rec, req)

		if rec.Code != http.StatusForbidden {
			t.Fatalf("expected 403 Forbidden, got %d", rec.Code)
		}
	})

	t.Run("Valid file download", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/reports/download?file="+validPath, nil)
		ctx := context.WithValue(req.Context(), middleware.TenantIDKey, "tenant-1")
		req = req.WithContext(ctx)

		rec := httptest.NewRecorder()
		handler.DownloadReport(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d: %s", rec.Code, rec.Body.String())
		}
		if rec.Body.String() != "header1,header2\nval1,val2" {
			t.Fatalf("expected file body, got %q", rec.Body.String())
		}
	})
}
