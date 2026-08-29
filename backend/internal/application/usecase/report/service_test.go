package report

import (
	"bytes"
	"context"
	"encoding/csv"
	"errors"
	"strings"
	"testing"

	storageport "ps/internal/application/ports/storage"
	clientdomain "ps/internal/domain/client"
	persondomain "ps/internal/domain/person"
	photographerdomain "ps/internal/domain/photographer"
)

// Mock implementations
type mockClientRepo struct {
	clients []*clientdomain.SeasonClient
}

func (m *mockClientRepo) Create(ctx context.Context, client *clientdomain.SeasonClient) error {
	return nil
}
func (m *mockClientRepo) GetByID(ctx context.Context, id, tenantID string) (*clientdomain.SeasonClient, error) {
	return nil, nil
}
func (m *mockClientRepo) List(ctx context.Context, tenantID string, filter clientdomain.ListFilter) (*clientdomain.PaginatedClients, error) {
	return &clientdomain.PaginatedClients{
		Data:  m.clients,
		Total: int64(len(m.clients)),
	}, nil
}
func (m *mockClientRepo) StreamByTenant(ctx context.Context, tenantID string, fn func(c *clientdomain.SeasonClient) error) error {
	for _, c := range m.clients {
		if c.TenantID == tenantID {
			if err := fn(c); err != nil {
				return err
			}
		}
	}
	return nil
}
func (m *mockClientRepo) Update(ctx context.Context, client *clientdomain.SeasonClient) error {
	return nil
}
func (m *mockClientRepo) Delete(ctx context.Context, id, tenantID string) error {
	return nil
}

type mockPersonRepo struct {
	people map[string]*persondomain.Person
}

func (m *mockPersonRepo) Create(ctx context.Context, person *persondomain.Person) error {
	return nil
}
func (m *mockPersonRepo) GetByID(ctx context.Context, id, tenantID string) (*persondomain.Person, error) {
	if p, ok := m.people[id]; ok {
		return p, nil
	}
	return nil, errors.New("person not found")
}
func (m *mockPersonRepo) List(ctx context.Context, tenantID string) ([]*persondomain.Person, error) {
	return nil, nil
}
func (m *mockPersonRepo) Update(ctx context.Context, person *persondomain.Person) error {
	return nil
}
func (m *mockPersonRepo) Delete(ctx context.Context, id, tenantID string) error {
	return nil
}

type mockPhotographerRepo struct {
	photographers []*photographerdomain.Photographer
}

func (m *mockPhotographerRepo) Create(ctx context.Context, photographer *photographerdomain.Photographer) error {
	return nil
}
func (m *mockPhotographerRepo) GetByID(ctx context.Context, id, tenantID string) (*photographerdomain.Photographer, error) {
	return nil, nil
}
func (m *mockPhotographerRepo) List(ctx context.Context, tenantID string) ([]*photographerdomain.Photographer, error) {
	return m.photographers, nil
}
func (m *mockPhotographerRepo) Update(ctx context.Context, photographer *photographerdomain.Photographer) error {
	return nil
}
func (m *mockPhotographerRepo) Delete(ctx context.Context, id, tenantID string) error {
	return nil
}

type mockStorageProvider struct {
	files map[string][]byte
}

func (m *mockStorageProvider) Save(ctx context.Context, path string, file storageport.File) (storageport.StoredObject, error) {
	if m.files == nil {
		m.files = make(map[string][]byte)
	}
	m.files[path] = file.Data
	return storageport.StoredObject{FileName: path, Size: int64(len(file.Data))}, nil
}
func (m *mockStorageProvider) Get(ctx context.Context, path string) ([]byte, error) {
	if data, ok := m.files[path]; ok {
		return data, nil
	}
	return nil, errors.New("file not found")
}
func (m *mockStorageProvider) Delete(ctx context.Context, path string) error {
	delete(m.files, path)
	return nil
}

type mockEmailSender struct {
	sentReports []struct {
		Email       string
		Name        string
		ReportName  string
		DownloadURL string
	}
}

func (m *mockEmailSender) SendVerificationEmail(ctx context.Context, toEmail, toName, token string) error {
	return nil
}
func (m *mockEmailSender) SendPasswordResetEmail(ctx context.Context, toEmail, toName, token string) error {
	return nil
}
func (m *mockEmailSender) SendReportReadyEmail(ctx context.Context, toEmail, toName, reportName, downloadURL string) error {
	m.sentReports = append(m.sentReports, struct {
		Email       string
		Name        string
		ReportName  string
		DownloadURL string
	}{
		Email:       toEmail,
		Name:        toName,
		ReportName:  reportName,
		DownloadURL: downloadURL,
	})
	return nil
}

func TestGenerateClientsCSV_FullExpansionAndRules(t *testing.T) {
	tenantID := "tenant-123"
	amount100 := 100.50
	amount200 := 200.00

	clientRepo := &mockClientRepo{
		clients: []*clientdomain.SeasonClient{
			{
				ID:       "client-1",
				TenantID: tenantID,
				PersonID: "person-1",
				Dogs: []clientdomain.Dog{
					{
						Breed:           "Border Collie",
						Judge:           "Juiz Silva",
						WonCompetitions: []string{"Melhor da Raça", "Campeão Adulto"}, // 2 won comps, 2 photos -> total lines = 2
						Photos: []clientdomain.Photo{
							{
								FileNumber:     "IMG_001",
								PhotographerID: "photog-1",
								PaymentMethod:  "Pix",
								AmountPaid:     &amount100,
							},
							{
								FileNumber:     "IMG_002",
								PhotographerID: "photog-2",
								PaymentMethod:  "Credit Card",
								AmountPaid:     &amount200,
							},
						},
					},
					{
						Breed:           "Golden Retriever",
						Judge:           "Juiz Santos",
						CompetitionsWon: 3, // 3 competitions won, 2 photos -> total lines = 3 (photo 2 repeated)
						Photos: []clientdomain.Photo{
							{
								FileNumber:     "=MALICIOUS_CMD", // Test CSV injection
								PhotographerID: "photog-1",
								PaymentMethod:  "Cash",
								AmountPaid:     nil,
							},
							{
								FileNumber:     "+SUM(A1:A2)",
								PhotographerID: "photog-2",
								PaymentMethod:  "Pix",
								AmountPaid:     &amount100,
							},
						},
					},
				},
			},
			{
				ID:       "client-2",
				TenantID: tenantID,
				PersonID: "person-2",
				Dogs: []clientdomain.Dog{
					{
						Breed:           "Poodle",
						Judge:           "Juiz Oliveira",
						CompetitionsWon: 0,
						Photos:          nil, // 0 lines -> 1 row empty
					},
				},
			},
			{
				ID:       "client-3",
				TenantID: tenantID,
				PersonID: "person-3",
				Dogs:     nil, // no dogs -> 1 row empty
			},
		},
	}

	personRepo := &mockPersonRepo{
		people: map[string]*persondomain.Person{
			"person-1": {
				ID:               "person-1",
				Name:             "Maria Souza",
				Email:            "maria@exemplo.com",
				AlternativeEmail: "maria.alt@exemplo.com",
				Phone:            "11999998888",
			},
			"person-2": {
				ID:    "person-2",
				Name:  "João Pereira",
				Email: "joao@exemplo.com",
			},
			"person-3": {
				ID:    "person-3",
				Name:  "Ana Costa",
				Email: "ana@exemplo.com",
			},
		},
	}

	photographerRepo := &mockPhotographerRepo{
		photographers: []*photographerdomain.Photographer{
			{ID: "photog-1", Name: "Fotógrafo Alpha"},
			{ID: "photog-2", Name: "Fotógrafo Beta"},
		},
	}

	storage := &mockStorageProvider{}
	emailSender := &mockEmailSender{}

	svc := NewService(clientRepo, personRepo, photographerRepo, storage, emailSender, "http://localhost:8080")

	filePath, err := svc.GenerateClientsCSV(context.Background(), tenantID, "admin@tenant.com", "Admin")
	if err != nil {
		t.Fatalf("unexpected error generating CSV: %v", err)
	}

	if !strings.HasPrefix(filePath, "reports/tenant_tenant-123/clientes_") {
		t.Fatalf("unexpected file path format: %s", filePath)
	}

	csvData, ok := storage.files[filePath]
	if !ok || len(csvData) == 0 {
		t.Fatalf("CSV data not saved in storage")
	}

	reader := csv.NewReader(bytes.NewReader(csvData))
	records, err := reader.ReadAll()
	if err != nil {
		t.Fatalf("failed to read parsed CSV records: %v", err)
	}

	// Header + 2 (dog-1) + 3 (dog-2) + 1 (dog-3) + 1 (client-3) = 8 rows total
	expectedRows := 1 + 2 + 3 + 1 + 1
	if len(records) != expectedRows {
		t.Fatalf("expected %d rows in CSV, got %d", expectedRows, len(records))
	}

	// Check Header
	headers := records[0]
	if headers[0] != "Nome" || headers[4] != "Número do Arquivo da Foto" || headers[5] != "Fotografo" {
		t.Fatalf("headers mismatch: %v", headers)
	}

	// Check dog-1 rows (2 rows)
	row1 := records[1]
	if row1[0] != "Maria Souza" || row1[3] != "(11) 99999-8888" || row1[4] != "IMG_001" || row1[5] != "Fotógrafo Alpha" || row1[6] != "Melhor da Raça" || row1[8] != "Pix" || row1[10] != "100.50" {
		t.Fatalf("row 1 mismatch: %v", row1)
	}
	row2 := records[2]
	if row2[3] != "(11) 99999-8888" || row2[4] != "IMG_002" || row2[5] != "Fotógrafo Beta" || row2[6] != "Campeão Adulto" || row2[8] != "Cartão de Crédito" || row2[10] != "200.00" {
		t.Fatalf("row 2 mismatch: %v", row2)
	}

	// Check dog-2 rows (3 rows, CSV injection sanitized with single quote, photo repeated on 3rd row)
	row3 := records[3]
	if row3[4] != "'=MALICIOUS_CMD" || row3[6] != "Sim" || row3[8] != "Dinheiro" {
		t.Fatalf("expected sanitized CSV injection and Dinheiro payment, got: %v", row3)
	}
	row4 := records[4]
	if row4[4] != "'+SUM(A1:A2)" || row4[6] != "Sim" || row4[8] != "Pix" {
		t.Fatalf("expected sanitized CSV injection field, got: %s", row4[4])
	}
	row5 := records[5]
	if row5[4] != "'+SUM(A1:A2)" || row5[6] != "Sim" {
		t.Fatalf("expected repeated photo on row 5, got: %s", row5[4])
	}

	// Check email sent
	if len(emailSender.sentReports) != 1 {
		t.Fatalf("expected 1 email to be sent, got %d", len(emailSender.sentReports))
	}
	if emailSender.sentReports[0].Email != "admin@tenant.com" {
		t.Fatalf("expected email to admin@tenant.com, got %s", emailSender.sentReports[0].Email)
	}

	// Check GetReportFile security
	_, err = svc.GetReportFile(context.Background(), tenantID, filePath)
	if err != nil {
		t.Fatalf("expected GetReportFile to succeed for owner tenant, got: %v", err)
	}

	// Check other tenant cannot access file
	_, err = svc.GetReportFile(context.Background(), "other-tenant", filePath)
	if !errors.Is(err, ErrUnauthorizedTenant) {
		t.Fatalf("expected ErrUnauthorizedTenant when accessing other tenant's report, got: %v", err)
	}
}

func TestSanitizeCSVField(t *testing.T) {
	cases := []struct {
		input    string
		expected string
	}{
		{"=1+1", "'=1+1"},
		{"+cmd", "'+cmd"},
		{"-formula", "'-formula"},
		{"@SUM()", "'@SUM()"},
		{"\tTabbed", "'\tTabbed"},
		{"Normal Text", "Normal Text"},
		{"", ""},
	}

	for _, tc := range cases {
		got := SanitizeCSVField(tc.input)
		if got != tc.expected {
			t.Errorf("SanitizeCSVField(%q) = %q, expected %q", tc.input, got, tc.expected)
		}
	}
}

func TestFormatPhone(t *testing.T) {
	cases := []struct {
		input    string
		expected string
	}{
		{"92991803034", "(92) 99180-3034"},
		{"62996578137", "(62) 99657-8137"},
		{"(21) 97297-8784", "(21) 97297-8784"},
		{"1133334444", "(11) 3333-4444"},
		{"999998888", "99999-8888"},
		{"33334444", "3333-4444"},
		{"", ""},
	}

	for _, tc := range cases {
		got := FormatPhone(tc.input)
		if got != tc.expected {
			t.Errorf("FormatPhone(%q) = %q, expected %q", tc.input, got, tc.expected)
		}
	}
}

func TestNormalizePaymentMethod(t *testing.T) {
	cases := []struct {
		input    string
		expected string
	}{
		{"Credit Card", "Cartão de Crédito"},
		{"credit_card", "Cartão de Crédito"},
		{"Debit Card", "Cartão de Débito"},
		{"debit_card", "Cartão de Débito"},
		{"Cash", "Dinheiro"},
		{"dinheiro", "Dinheiro"},
		{"Pix", "Pix"},
		{"Não pago", "Não pago"},
		{"nao_pago", "Não pago"},
		{"Not Paid", "Não pago"},
		{"Outro", "Outro"},
	}

	for _, tc := range cases {
		got := NormalizePaymentMethod(tc.input)
		if got != tc.expected {
			t.Errorf("NormalizePaymentMethod(%q) = %q, expected %q", tc.input, got, tc.expected)
		}
	}
}

func TestGenerateUnpaidClientsCSV(t *testing.T) {
	tenantID := "tenant-456"
	amount50 := 50.0
	amount150 := 150.0
	amount200 := 200.0

	clientRepo := &mockClientRepo{
		clients: []*clientdomain.SeasonClient{
			{
				ID:       "client-1",
				TenantID: tenantID,
				PersonID: "person-1",
				Dogs: []clientdomain.Dog{
					{
						Breed: "Golden",
						Judge: "Juiz A",
						Photos: []clientdomain.Photo{
							{
								FileNumber:     "IMG_101",
								PhotographerID: "photog-1",
								PaymentMethod:  "Pix",
								AmountPaid:     &amount50,
							},
							{
								FileNumber:     "=CMD_INJECTION",
								PhotographerID: "photog-2",
								PaymentMethod:  "Não pago",
								AmountPaid:     &amount150,
							},
						},
					},
					{
						Breed: "Poodle",
						Judge: "Juiz B",
						Photos: []clientdomain.Photo{
							{
								FileNumber:     "IMG_103",
								PhotographerID: "photog-1",
								PaymentMethod:  "pendente",
								AmountPaid:     nil,
							},
						},
					},
				},
			},
			{
				ID:       "client-2",
				TenantID: tenantID,
				PersonID: "person-2",
				Dogs: []clientdomain.Dog{
					{
						Breed: "Bulldog",
						Judge: "Juiz C",
						Photos: []clientdomain.Photo{
							{
								FileNumber:     "IMG_201",
								PhotographerID: "photog-1",
								PaymentMethod:  "Cartão de Crédito",
								AmountPaid:     &amount200,
							},
						},
					},
				},
			},
			{
				ID:       "client-3",
				TenantID: tenantID,
				PersonID: "person-3",
				Dogs: []clientdomain.Dog{
					{
						Breed: "Shih Tzu",
						Judge: "Juiz D",
						Photos: []clientdomain.Photo{
							{
								FileNumber:     "IMG_301",
								PhotographerID: "photog-unknown",
								PaymentMethod:  "",
								AmountPaid:     nil,
							},
						},
					},
				},
			},
		},
	}

	personRepo := &mockPersonRepo{
		people: map[string]*persondomain.Person{
			"person-1": {
				ID:               "person-1",
				Name:             "Carlos Lima",
				Email:            "carlos@test.com",
				AlternativeEmail: "carlos.alt@test.com",
				Phone:            "11988887777",
			},
			"person-2": {
				ID:    "person-2",
				Name:  "Renata Costa",
				Email: "renata@test.com",
				Phone: "21977776666",
			},
			"person-3": {
				ID:    "person-3",
				Name:  "Marcos Souza",
				Email: "marcos@test.com",
				Phone: "81966665555",
			},
		},
	}

	photographerRepo := &mockPhotographerRepo{
		photographers: []*photographerdomain.Photographer{
			{ID: "photog-1", Name: "Fotógrafo Alpha"},
			{ID: "photog-2", Name: "Fotógrafo Beta"},
		},
	}

	storage := &mockStorageProvider{}
	emailSender := &mockEmailSender{}

	svc := NewService(clientRepo, personRepo, photographerRepo, storage, emailSender, "http://localhost:8080")

	filePath, err := svc.GenerateUnpaidClientsCSV(context.Background(), tenantID, "user@test.com", "Tester")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if !strings.HasPrefix(filePath, "reports/tenant_tenant-456/clientes_nao_pagos_") {
		t.Fatalf("unexpected file path: %s", filePath)
	}

	csvData, ok := storage.files[filePath]
	if !ok || len(csvData) == 0 {
		t.Fatalf("CSV not saved in storage")
	}

	reader := csv.NewReader(bytes.NewReader(csvData))
	records, err := reader.ReadAll()
	if err != nil {
		t.Fatalf("failed to parse CSV: %v", err)
	}

	// 1 Header + 2 rows from client-1 + 0 from client-2 + 1 from client-3 = 4 rows
	if len(records) != 4 {
		t.Fatalf("expected 4 rows, got %d", len(records))
	}

	// Header check
	expectedHeaders := []string{
		"Nome", "E-mail", "E-mail alternativo", "Telefone", "Raça", "Juiz",
		"Número do Arquivo da Foto", "Fotografo", "Status do Pagamento", "Valor Devido / Pago",
	}
	for i, h := range expectedHeaders {
		if records[0][i] != h {
			t.Fatalf("header mismatch at %d: got %s, want %s", i, records[0][i], h)
		}
	}

	// Row 1: client-1 photo 2
	row1 := records[1]
	if row1[0] != "Carlos Lima" || row1[3] != "(11) 98888-7777" || row1[4] != "Golden" || row1[5] != "Juiz A" || row1[6] != "'=CMD_INJECTION" || row1[7] != "Fotógrafo Beta" || row1[8] != "Não pago" || row1[9] != "150.00" {
		t.Fatalf("row 1 mismatch: %v", row1)
	}

	// Row 2: client-1 photo 3
	row2 := records[2]
	if row2[0] != "Carlos Lima" || row2[4] != "Poodle" || row2[5] != "Juiz B" || row2[6] != "IMG_103" || row2[7] != "Fotógrafo Alpha" || row2[8] != "Não pago" || row2[9] != "" {
		t.Fatalf("row 2 mismatch: %v", row2)
	}

	// Row 3: client-3 photo 1
	row3 := records[3]
	if row3[0] != "Marcos Souza" || row3[3] != "(81) 96666-5555" || row3[4] != "Shih Tzu" || row3[5] != "Juiz D" || row3[6] != "IMG_301" || row3[7] != "photog-unknown" || row3[8] != "Não pago" || row3[9] != "" {
		t.Fatalf("row 3 mismatch: %v", row3)
	}

	// Check email notification
	if len(emailSender.sentReports) != 1 {
		t.Fatalf("expected 1 email sent, got %d", len(emailSender.sentReports))
	}
	if emailSender.sentReports[0].Email != "user@test.com" || emailSender.sentReports[0].ReportName != "Relatório de Clientes Não Pagos" {
		t.Fatalf("unexpected email details: %v", emailSender.sentReports[0])
	}
}

