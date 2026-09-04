package report

import (
	"bytes"
	"context"
	"encoding/csv"
	"errors"
	"strings"
	"testing"

	reportport "ps/internal/application/ports/report"
	storageport "ps/internal/application/ports/storage"
	clientdomain "ps/internal/domain/client"
	persondomain "ps/internal/domain/person"
	photographerdomain "ps/internal/domain/photographer"
	reportdomain "ps/internal/domain/report"
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
func (m *mockClientRepo) StreamByTenant(ctx context.Context, tenantID, seasonID string, fn func(c *clientdomain.SeasonClient) error) error {
	for _, c := range m.clients {
		if c.TenantID == tenantID && (seasonID == "" || c.SeasonID == seasonID) {
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
func (m *mockClientRepo) CountBySeason(ctx context.Context, tenantID, seasonID string) (int64, error) {
	var count int64
	for _, c := range m.clients {
		if c.TenantID == tenantID && (seasonID == "" || c.SeasonID == seasonID) {
			count++
		}
	}
	return count, nil
}
func (m *mockClientRepo) MaxClientsPerSeason(ctx context.Context, tenantID string) (int64, error) {
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
func (m *mockClientRepo) DeleteBySeasonID(ctx context.Context, seasonID, tenantID string) error {
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
						WonCompetitions: []string{"Melhor da Raça", "Campeão Adulto"}, // 2 won comps, 2 photos -> total lines = 2
						Photos: []clientdomain.Photo{
							{
								FileNumber:     "IMG_001",
								PhotographerID: "photog-1",
								PaymentMethod:  "Pix",
								AmountPaid:     &amount100,
								Judges:         []string{"Juiz Silva"},
							},
							{
								FileNumber:     "IMG_002",
								PhotographerID: "photog-2",
								PaymentMethod:  "Credit Card",
								Currency:       "USD",
								AmountPaid:     &amount200,
								Judges:         []string{"Juiz Silva"},
							},
						},
					},
					{
						Breed:           "Golden Retriever",
						CompetitionsWon: 3, // 3 competitions won, 2 photos -> total lines = 3 (photo 2 repeated)
						Photos: []clientdomain.Photo{
							{
								FileNumber:     "=MALICIOUS_CMD", // Test CSV injection
								PhotographerID: "photog-1",
								PaymentMethod:  "Cash",
								AmountPaid:     nil,
								Judges:         []string{"Juiz Santos"},
							},
							{
								FileNumber:     "+SUM(A1:A2)",
								PhotographerID: "photog-2",
								PaymentMethod:  "Pix",
								AmountPaid:     &amount100,
								Judges:         []string{"Juiz Santos"},
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

	filePath, err := svc.GenerateClientsCSV(context.Background(), tenantID, "", "admin@tenant.com", "Admin")
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

	if !bytes.HasPrefix(csvData, []byte("\xEF\xBB\xBF")) {
		t.Fatalf("expected UTF-8 BOM at start of CSV file")
	}

	reader := csv.NewReader(bytes.NewReader(bytes.TrimPrefix(csvData, []byte("\xEF\xBB\xBF"))))
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
	if headers[0] != "Nome" || headers[4] != "Dono do Cachorro" || headers[5] != "Raça" || headers[6] != "Juiz" || headers[8] != "Número do Arquivo da Foto" {
		t.Fatalf("headers mismatch: %v", headers)
	}

	// Check dog-1 rows (2 rows)
	// Headers: Nome[0], Email[1], AltEmail[2], Phone[3], Dono[4], Raca[5], Juiz[6], Comp[7], Arquivo[8], Fotografo[9], Pagamento[10], Valor[11], Data[12]
	row1 := records[1]
	if row1[0] != "Maria Souza" || row1[3] != "(11) 99999-8888" || row1[4] != "Sim" || row1[5] != "Border Collie" || row1[6] != "Juiz Silva" || row1[7] != "Melhor da Raça" || row1[8] != "IMG_001" || row1[9] != "Fotógrafo Alpha" || row1[10] != "Pix" || row1[11] != "R$ 100.50" {
		t.Fatalf("row 1 mismatch: %v", row1)
	}
	row2 := records[2]
	if row2[3] != "(11) 99999-8888" || row2[7] != "Campeão Adulto" || row2[8] != "IMG_002" || row2[9] != "Fotógrafo Beta" || row2[10] != "Cartão de Crédito" || row2[11] != "$ 200.00" {
		t.Fatalf("row 2 mismatch: %v", row2)
	}

	// Check dog-2 rows (3 rows, CSV injection sanitized with single quote, photo repeated on 3rd row)
	row3 := records[3]
	if row3[8] != "'=MALICIOUS_CMD" || row3[7] != "Sim" || row3[10] != "Dinheiro" {
		t.Fatalf("expected sanitized CSV injection and Dinheiro payment, got: %v", row3)
	}
	row4 := records[4]
	if row4[8] != "'+SUM(A1:A2)" || row4[7] != "Sim" || row4[10] != "Pix" {
		t.Fatalf("expected sanitized CSV injection field, got: %s", row4[8])
	}
	row5 := records[5]
	if row5[8] != "'+SUM(A1:A2)" || row5[7] != "Sim" {
		t.Fatalf("expected repeated photo on row 5, got: %s", row5[8])
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

func TestGenerateClientsPDF_Success(t *testing.T) {
	tenantID := "tenant-456"
	amount150 := 150.0
	isTrue := true
	isFalse := false

	clientRepo := &mockClientRepo{
		clients: []*clientdomain.SeasonClient{
			{
				ID:       "client-1",
				TenantID: tenantID,
				PersonID: "person-1",
				Dogs: []clientdomain.Dog{
					{
						Breed:           "Dachshund",
						Judges:          []string{"Tamas Jakkel", "Jorge jose"},
						IsOwner:         &isTrue,
						WonCompetitions: []string{"Melhor Filhote Américas e Caribe", "Cachorro Maluco"},
						Photos: []clientdomain.Photo{
							{FileNumber: "4124", PaymentMethod: "Pix", AmountPaid: &amount150},
							{FileNumber: "4128", PaymentMethod: "Pix", AmountPaid: &amount150},
						},
					},
					{
						Breed:           "Basset Hund",
						Judge:           "José Maurício Medeiros",
						IsOwner:         &isFalse,
						WonCompetitions: []string{"Melhor Raça"},
						Photos: []clientdomain.Photo{
							{FileNumber: "4125", PaymentMethod: "Não pago"},
						},
					},
				},
			},
		},
	}

	personRepo := &mockPersonRepo{
		people: map[string]*persondomain.Person{
			"person-1": {
				ID:    "person-1",
				Name:  "Alex Itaboray",
				Email: "alexitaboray@gmail.com",
				Phone: "62996578137",
			},
		},
	}

	photographerRepo := &mockPhotographerRepo{}
	storage := &mockStorageProvider{}
	emailSender := &mockEmailSender{}

	svc := NewService(clientRepo, personRepo, photographerRepo, storage, emailSender, "http://localhost:8080")

	// Direct PDF test
	pdfBytes, err := svc.GenerateDirectClientsPDF(context.Background(), tenantID, "")
	if err != nil {
		t.Fatalf("unexpected error generating direct PDF: %v", err)
	}
	if len(pdfBytes) < 500 {
		t.Fatalf("generated PDF too small (%d bytes)", len(pdfBytes))
	}
	// Check PDF magic bytes '%PDF-'
	if !bytes.HasPrefix(pdfBytes, []byte("%PDF-")) {
		t.Fatalf("file content does not start with PDF magic header %%PDF-")
	}

	// Async PDF test with email
	pdfPath, err := svc.GenerateClientsPDF(context.Background(), tenantID, "", "user@example.com", "User")
	if err != nil {
		t.Fatalf("unexpected error generating PDF with email: %v", err)
	}
	if !strings.HasSuffix(pdfPath, ".pdf") {
		t.Fatalf("expected .pdf extension in path, got: %s", pdfPath)
	}
	if len(emailSender.sentReports) != 1 {
		t.Fatalf("expected 1 email sent, got %d", len(emailSender.sentReports))
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

func TestFormatPaidAmount(t *testing.T) {
	val100 := 100.50
	valZero := 0.0
	cases := []struct {
		amount   *float64
		currency string
		expected string
	}{
		{nil, "BRL", ""},
		{nil, "USD", ""},
		{&val100, "USD", "$ 100.50"},
		{&val100, "usd", "$ 100.50"},
		{&val100, "BRL", "R$ 100.50"},
		{&val100, "", "R$ 100.50"},
		{&valZero, "USD", "$ 0.00"},
		{&valZero, "BRL", "R$ 0.00"},
	}

	for _, tc := range cases {
		got := FormatPaidAmount(tc.amount, tc.currency)
		if got != tc.expected {
			t.Errorf("FormatPaidAmount(%v, %q) = %q, expected %q", tc.amount, tc.currency, got, tc.expected)
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
						Photos: []clientdomain.Photo{
							{
								FileNumber:     "IMG_101",
								PhotographerID: "photog-1",
								PaymentMethod:  "Pix",
								AmountPaid:     &amount50,
								Judges:         []string{"Juiz A"},
							},
							{
								FileNumber:     "=CMD_INJECTION",
								PhotographerID: "photog-2",
								PaymentMethod:  "Não pago",
								AmountPaid:     &amount150,
								Judges:         []string{"Juiz A"},
							},
						},
					},
					{
						Breed: "Poodle",
						Photos: []clientdomain.Photo{
							{
								FileNumber:     "IMG_103",
								PhotographerID: "photog-1",
								PaymentMethod:  "pendente",
								AmountPaid:     nil,
								Judges:         []string{"Juiz B"},
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
						Photos: []clientdomain.Photo{
							{
								FileNumber:     "IMG_201",
								PhotographerID: "photog-1",
								PaymentMethod:  "Cartão de Crédito",
								AmountPaid:     &amount200,
								Judges:         []string{"Juiz C"},
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
						Photos: []clientdomain.Photo{
							{
								FileNumber:     "IMG_301",
								PhotographerID: "photog-unknown",
								PaymentMethod:  "",
								AmountPaid:     nil,
								Judges:         []string{"Juiz D"},
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

	filePath, err := svc.GenerateUnpaidClientsCSV(context.Background(), tenantID, "", "user@test.com", "Tester")
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

	reader := csv.NewReader(bytes.NewReader(bytes.TrimPrefix(csvData, []byte("\xEF\xBB\xBF"))))
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
	if row1[0] != "Carlos Lima" || row1[3] != "(11) 98888-7777" || row1[4] != "Golden" || row1[5] != "Juiz A" || row1[6] != "'=CMD_INJECTION" || row1[7] != "Fotógrafo Beta" || row1[8] != "Não pago" || row1[9] != "R$ 150.00" {
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

func TestGenerateReports_FilterBySeasonID(t *testing.T) {
	tenantID := "tenant-xyz"
	season1 := "season-1"
	season2 := "season-2"

	clientRepo := &mockClientRepo{
		clients: []*clientdomain.SeasonClient{
			{
				ID:       "client-s1",
				TenantID: tenantID,
				SeasonID: season1,
				PersonID: "person-1",
				Dogs: []clientdomain.Dog{
					{
						Breed: "Golden",
						Photos: []clientdomain.Photo{
							{FileNumber: "S1_001", PaymentMethod: "Pix"},
						},
					},
				},
			},
			{
				ID:       "client-s2",
				TenantID: tenantID,
				SeasonID: season2,
				PersonID: "person-2",
				Dogs: []clientdomain.Dog{
					{
						Breed: "Poodle",
						Photos: []clientdomain.Photo{
							{FileNumber: "S2_001", PaymentMethod: "Pix"},
						},
					},
				},
			},
		},
	}

	personRepo := &mockPersonRepo{
		people: map[string]*persondomain.Person{
			"person-1": {ID: "person-1", Name: "Cliente Evento 1"},
			"person-2": {ID: "person-2", Name: "Cliente Evento 2"},
		},
	}

	photographerRepo := &mockPhotographerRepo{}
	storage := &mockStorageProvider{}
	emailSender := &mockEmailSender{}

	svc := NewService(clientRepo, personRepo, photographerRepo, storage, emailSender, "http://localhost:8080")

	// Export CSV filtered by season 1
	filePath, err := svc.GenerateClientsCSV(context.Background(), tenantID, season1, "admin@test.com", "Admin")
	if err != nil {
		t.Fatalf("unexpected error generating filtered CSV: %v", err)
	}

	csvData := storage.files[filePath]
	reader := csv.NewReader(bytes.NewReader(bytes.TrimPrefix(csvData, []byte("\xEF\xBB\xBF"))))
	records, err := reader.ReadAll()
	if err != nil {
		t.Fatalf("failed to read CSV records: %v", err)
	}

	// Header (1) + Client Season 1 (1) = 2 rows
	if len(records) != 2 {
		t.Fatalf("expected 2 rows for season 1 filter, got %d", len(records))
	}
	if records[1][0] != "Cliente Evento 1" || records[1][5] != "Golden" {
		t.Fatalf("unexpected record content: %v", records[1])
	}

	// Export PDF filtered by season 2
	pdfBytes, err := svc.GenerateDirectClientsPDF(context.Background(), tenantID, season2)
	if err != nil {
		t.Fatalf("unexpected error generating filtered PDF: %v", err)
	}
	if len(pdfBytes) < 500 {
		t.Fatalf("expected valid PDF bytes, got %d", len(pdfBytes))
	}
}

func TestGenerateClientsPDF_MultiLineJudgesAndAccents(t *testing.T) {
	tenantID := "tenant-accents"
	amount := 250.0

	clientRepo := &mockClientRepo{
		clients: []*clientdomain.SeasonClient{
			{
				ID:       "client-1",
				TenantID: tenantID,
				PersonID: "person-1",
				Dogs: []clientdomain.Dog{
					{
						Breed: "Pastor Alemão Capa Preta com Pedigree",
						WonCompetitions: []string{
							"Melhor Filhote Américas e Caribe 2026 - Exposição Internacional",
							"Campeão Adulto Nacional de Criação",
						},
						Photos: []clientdomain.Photo{
							{
								FileNumber:    "IMG_9999",
								PaymentMethod: "Cartão de Crédito",
								AmountPaid:    &amount,
								Judges:        []string{"Dr. Thiago Lopes Moreira", "Norberto da Silva Castro", "José Maurício Medeiros Júnior"},
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
				ID:    "person-1",
				Name:  "João da Silva Conceição & Família",
				Email: "joao.conceicao@exemplo.com.br",
				Phone: "11988887777",
			},
		},
	}

	svc := NewService(clientRepo, personRepo, &mockPhotographerRepo{}, &mockStorageProvider{}, &mockEmailSender{}, "http://localhost:8080")

	pdfBytes, err := svc.GenerateDirectClientsPDF(context.Background(), tenantID, "")
	if err != nil {
		t.Fatalf("unexpected error generating PDF with accents: %v", err)
	}
	if !bytes.HasPrefix(pdfBytes, []byte("%PDF-")) {
		t.Fatalf("expected PDF magic header %%PDF-")
	}
}

func TestGeneratePaidClientsCSV(t *testing.T) {
	tenantID := "tenant-paid-123"
	amount100 := 100.00
	amount250 := 250.50
	amount50 := 50.00
	isOwnerTrue := true
	isOwnerFalse := false

	clientRepo := &mockClientRepo{
		clients: []*clientdomain.SeasonClient{
			{
				ID:       "client-1",
				TenantID: tenantID,
				PersonID: "person-1",
				Dogs: []clientdomain.Dog{
					{
						Breed:           "Golden Retriever",
						IsOwner:         &isOwnerTrue,
						WonCompetitions: []string{"Campeão Jovem", "Melhor da Raça"},
						Photos: []clientdomain.Photo{
							{
								FileNumber:     "IMG_100",
								PhotographerID: "photog-1",
								PaymentMethod:  "Pix",
								AmountPaid:     &amount100,
								Judges:         []string{"Juiz Santos"},
							},
							{
								FileNumber:     "IMG_101",
								PhotographerID: "photog-2",
								PaymentMethod:  "Cartão de Crédito",
								Currency:       "USD",
								AmountPaid:     &amount250,
								Judges:         []string{"Juiz Santos", "Juiz Oliveira"},
							},
							{
								FileNumber:     "IMG_102",
								PhotographerID: "photog-1",
								PaymentMethod:  "Não pago",
								AmountPaid:     nil,
							},
						},
					},
					{
						Breed:           "Border Collie",
						IsOwner:         &isOwnerFalse,
						CompetitionsWon: 2,
						Photos: []clientdomain.Photo{
							{
								FileNumber:     "=MALICIOUS_CMD",
								PhotographerID: "photog-1",
								PaymentMethod:  "Dinheiro",
								AmountPaid:     &amount50,
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
						Breed: "Poodle",
						Photos: []clientdomain.Photo{
							{
								FileNumber:    "IMG_200",
								PaymentMethod: "Não pago",
							},
							{
								FileNumber:    "IMG_201",
								PaymentMethod: "",
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
				Name:             "Carlos Albuquerque",
				Email:            "carlos@exemplo.com",
				AlternativeEmail: "carlos.alt@exemplo.com",
				Phone:            "11988889999",
			},
			"person-2": {
				ID:    "person-2",
				Name:  "João Inadimplente",
				Email: "joao@exemplo.com",
			},
		},
	}

	photographerRepo := &mockPhotographerRepo{
		photographers: []*photographerdomain.Photographer{
			{ID: "photog-1", Name: "Fotógrafo Principal"},
			{ID: "photog-2", Name: "Fotógrafo Secundário"},
		},
	}

	storage := &mockStorageProvider{}
	emailSender := &mockEmailSender{}

	svc := NewService(clientRepo, personRepo, photographerRepo, storage, emailSender, "http://localhost:8080")

	// 1. Error on empty tenant
	_, err := svc.GeneratePaidClientsCSV(context.Background(), "", "", "admin@test.com", "Admin")
	if err == nil {
		t.Fatalf("expected error on empty tenant ID")
	}

	// 2. Generate paid clients report
	filePath, err := svc.GeneratePaidClientsCSV(context.Background(), tenantID, "", "admin@test.com", "Admin")
	if err != nil {
		t.Fatalf("unexpected error generating paid clients CSV: %v", err)
	}

	if !strings.HasPrefix(filePath, "reports/tenant_tenant-paid-123/clientes_pagos_") {
		t.Fatalf("unexpected file path: %s", filePath)
	}

	csvData, ok := storage.files[filePath]
	if !ok || len(csvData) == 0 {
		t.Fatalf("CSV data not found in storage")
	}

	if !bytes.HasPrefix(csvData, []byte("\xEF\xBB\xBF")) {
		t.Fatalf("expected UTF-8 BOM at start of CSV")
	}

	reader := csv.NewReader(bytes.NewReader(bytes.TrimPrefix(csvData, []byte("\xEF\xBB\xBF"))))
	records, err := reader.ReadAll()
	if err != nil {
		t.Fatalf("failed to parse CSV records: %v", err)
	}

	// Header + 2 paid photos (dog 1) + 1 paid photo (dog 2) = 4 rows
	if len(records) != 4 {
		t.Fatalf("expected 4 rows in paid clients CSV, got %d", len(records))
	}

	// Verify headers: Nome, E-mail, E-mail alternativo, Telefone, Dono, Raça, Juiz, Competições Vencidas, Número do Arquivo da Foto, Fotografo, Forma de Pagamento, Valor Pago, Data da Foto
	headers := records[0]
	expectedHeaders := []string{
		"Nome", "E-mail", "E-mail alternativo", "Telefone", "Dono", "Raça", "Juiz",
		"Competições Vencidas", "Número do Arquivo da Foto", "Fotografo", "Forma de Pagamento", "Valor Pago", "Data da Foto",
	}
	for i, h := range expectedHeaders {
		if headers[i] != h {
			t.Fatalf("header[%d] expected %q, got %q", i, h, headers[i])
		}
	}

	// Row 1 (IMG_100): Pix
	row1 := records[1]
	if row1[0] != "Carlos Albuquerque" || row1[3] != "(11) 98888-9999" || row1[4] != "Sim" || row1[5] != "Golden Retriever" || row1[6] != "Juiz Santos" || row1[7] != "Campeão Jovem, Melhor da Raça" || row1[8] != "IMG_100" || row1[9] != "Fotógrafo Principal" || row1[10] != "Pix" || row1[11] != "R$ 100.00" {
		t.Fatalf("unexpected row 1: %v", row1)
	}

	// Row 2 (IMG_101): Cartão de Crédito (USD)
	row2 := records[2]
	if row2[8] != "IMG_101" || row2[9] != "Fotógrafo Secundário" || row2[10] != "Cartão de Crédito" || row2[11] != "$ 250.50" || row2[6] != "Juiz Santos, Juiz Oliveira" {
		t.Fatalf("unexpected row 2: %v", row2)
	}

	// Row 3 (Malicious formula sanitized): Dinheiro
	row3 := records[3]
	if row3[4] != "Não" || row3[5] != "Border Collie" || row3[7] != "Sim" || row3[8] != "'=MALICIOUS_CMD" || row3[10] != "Dinheiro" || row3[11] != "R$ 50.00" {
		t.Fatalf("unexpected row 3: %v", row3)
	}

	// Verify email sent with proper subject
	if len(emailSender.sentReports) != 1 {
		t.Fatalf("expected 1 report email sent, got %d", len(emailSender.sentReports))
	}
	if emailSender.sentReports[0].ReportName != "Relatório de Clientes Pagos" {
		t.Fatalf("expected report name 'Relatório de Clientes Pagos', got %q", emailSender.sentReports[0].ReportName)
	}
}

type mockTestJobRepo struct {
	jobs []*reportdomain.ReportJob
}

func (m *mockTestJobRepo) Create(ctx context.Context, job *reportdomain.ReportJob) error {
	m.jobs = append(m.jobs, job)
	return nil
}
func (m *mockTestJobRepo) Update(ctx context.Context, job *reportdomain.ReportJob) error {
	for i, j := range m.jobs {
		if j.ID == job.ID {
			m.jobs[i] = job
			return nil
		}
	}
	m.jobs = append(m.jobs, job)
	return nil
}
func (m *mockTestJobRepo) GetByID(ctx context.Context, id, tenantID string) (*reportdomain.ReportJob, error) {
	for _, j := range m.jobs {
		if j.ID == id && j.TenantID == tenantID {
			return j, nil
		}
	}
	return nil, errors.New("not found")
}
func (m *mockTestJobRepo) List(ctx context.Context, filter reportport.ListFilter) (*reportport.ListResult, error) {
	var matched []*reportdomain.ReportJob
	for _, j := range m.jobs {
		if j.TenantID == filter.TenantID {
			if filter.SeasonID == "" || j.SeasonID == filter.SeasonID {
				matched = append(matched, j)
			}
		}
	}
	return &reportport.ListResult{
		Jobs:  matched,
		Total: int64(len(matched)),
		Page:  filter.Page,
		Limit: filter.Limit,
	}, nil
}

func TestGenerateDynamicPaymentCSV(t *testing.T) {
	val100 := 100.0
	val200 := 200.0
	clientRepo := &mockClientRepo{
		clients: []*clientdomain.SeasonClient{
			{
				ID:       "client-1",
				TenantID: "tenant-1",
				PersonID: "person-1",
				SeasonID: "season-1",
				Dogs: []clientdomain.Dog{
					{
						Breed: "Poodle",
						Photos: []clientdomain.Photo{
							{
								FileNumber:    "IMG_001",
								PaymentMethod: "Pix",
								AmountPaid:    &val100,
							},
							{
								FileNumber:    "IMG_002",
								PaymentMethod: "Não pago",
							},
							{
								FileNumber:    "IMG_003",
								PaymentMethod: "Dinheiro",
								AmountPaid:    &val200,
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
				ID:    "person-1",
				Name:  "Maria Silva",
				Email: "maria@example.com",
				Phone: "11999998888",
			},
		},
	}
	photogRepo := &mockPhotographerRepo{}
	storage := &mockStorageProvider{files: make(map[string][]byte)}
	emailSender := &mockEmailSender{}

	svc := NewService(clientRepo, personRepo, photogRepo, storage, emailSender, "http://localhost:8080")

	// 1. Filter: Paid only, specifically "Pix"
	isPaidTrue := true
	pathPix, err := svc.GenerateDynamicPaymentCSV(context.Background(), "tenant-1", "season-1", &reportdomain.ReportFilters{
		IsPaid:         &isPaidTrue,
		PaymentMethods: []string{"Pix"},
	}, "user@test.com", "User")
	if err != nil {
		t.Fatalf("unexpected error generating dynamic CSV: %v", err)
	}
	csvData := storage.files[pathPix]
	r := csv.NewReader(bytes.NewReader(bytes.TrimPrefix(csvData, []byte("\xEF\xBB\xBF"))))
	records, _ := r.ReadAll()
	// Header + 1 photo (IMG_001) = 2
	if len(records) != 2 {
		t.Fatalf("expected 2 records for Pix filter, got %d", len(records))
	}
	if records[1][8] != "IMG_001" || records[1][10] != "Pix" {
		t.Fatalf("unexpected record: %v", records[1])
	}

	// 2. Filter: Unpaid only
	isPaidFalse := false
	pathUnpaid, err := svc.GenerateDynamicPaymentCSV(context.Background(), "tenant-1", "season-1", &reportdomain.ReportFilters{
		IsPaid: &isPaidFalse,
	}, "", "")
	if err != nil {
		t.Fatalf("unexpected error generating unpaid dynamic CSV: %v", err)
	}
	csvDataUnpaid := storage.files[pathUnpaid]
	rUnpaid := csv.NewReader(bytes.NewReader(bytes.TrimPrefix(csvDataUnpaid, []byte("\xEF\xBB\xBF"))))
	recordsUnpaid, _ := rUnpaid.ReadAll()
	// Header + 1 photo (IMG_002) = 2
	if len(recordsUnpaid) != 2 {
		t.Fatalf("expected 2 records for Unpaid filter, got %d", len(recordsUnpaid))
	}
	if recordsUnpaid[1][8] != "IMG_002" || recordsUnpaid[1][10] != "Não pago" {
		t.Fatalf("unexpected record: %v", recordsUnpaid[1])
	}
}

func TestStartJobLifecycle(t *testing.T) {
	clientRepo := &mockClientRepo{}
	personRepo := &mockPersonRepo{people: make(map[string]*persondomain.Person)}
	photogRepo := &mockPhotographerRepo{}
	storage := &mockStorageProvider{files: make(map[string][]byte)}
	emailSender := &mockEmailSender{}
	jobRepo := &mockTestJobRepo{}

	svc := NewService(clientRepo, personRepo, photogRepo, storage, emailSender, "http://localhost:8080").
		WithReportRepo(jobRepo)

	job := &reportdomain.ReportJob{
		TenantID: "tenant-1",
		SeasonID: "season-1",
		Type:     reportdomain.TypeClientsCSV,
		RequestedBy: reportdomain.UserSummary{
			UserName:  "Test",
			UserEmail: "test@example.com",
		},
	}

	started, err := svc.StartJob(context.Background(), job)
	if err != nil {
		t.Fatalf("failed to start job: %v", err)
	}
	if started.ID == "" {
		t.Fatalf("expected job ID to be set")
	}

	// Test ListJobs
	listRes, err := svc.ListJobs(context.Background(), reportport.ListFilter{
		TenantID: "tenant-1",
		Page:     1,
		Limit:    10,
	})
	if err != nil {
		t.Fatalf("failed to list jobs: %v", err)
	}
	if len(listRes.Jobs) != 1 {
		t.Fatalf("expected 1 job in list, got %d", len(listRes.Jobs))
	}

	// Test GetJob
	found, err := svc.GetJob(context.Background(), started.ID, "tenant-1")
	if err != nil {
		t.Fatalf("failed to get job: %v", err)
	}
	if found.ID != started.ID {
		t.Fatalf("expected job ID %q, got %q", started.ID, found.ID)
	}
}
