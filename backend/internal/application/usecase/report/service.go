package report

import (
	"bytes"
	"context"
	"encoding/csv"
	"errors"
	"fmt"
	"log"
	"net/url"
	"path/filepath"
	"strings"
	"time"
	"unicode"

	"github.com/go-pdf/fpdf"

	clientport "ps/internal/application/ports/client"
	emailport "ps/internal/application/ports/email"
	personport "ps/internal/application/ports/person"
	photographerport "ps/internal/application/ports/photographer"
	storageport "ps/internal/application/ports/storage"
	clientdomain "ps/internal/domain/client"
	persondomain "ps/internal/domain/person"
)

var (
	ErrUnauthorizedTenant = errors.New("unauthorized tenant access to report")
	ErrInvalidReportPath  = errors.New("invalid report path")
)

type Service struct {
	clientRepo       clientport.Repository
	personRepo       personport.Repository
	photographerRepo photographerport.Repository
	storageProvider  storageport.Provider
	emailSender      emailport.Sender
	appBaseURL       string
}

func NewService(
	clientRepo clientport.Repository,
	personRepo personport.Repository,
	photographerRepo photographerport.Repository,
	storageProvider storageport.Provider,
	emailSender emailport.Sender,
	appBaseURL string,
) *Service {
	if appBaseURL == "" {
		appBaseURL = "http://localhost:8080"
	}
	return &Service{
		clientRepo:       clientRepo,
		personRepo:       personRepo,
		photographerRepo: photographerRepo,
		storageProvider:  storageProvider,
		emailSender:      emailSender,
		appBaseURL:       strings.TrimRight(appBaseURL, "/"),
	}
}

// FormatPhone standardizes Brazilian phone numbers into (XX) XXXXX-XXXX or (XX) XXXX-XXXX
func FormatPhone(phone string) string {
	var digits strings.Builder
	for _, r := range phone {
		if unicode.IsDigit(r) {
			digits.WriteRune(r)
		}
	}
	d := digits.String()
	switch len(d) {
	case 11:
		return fmt.Sprintf("(%s) %s-%s", d[0:2], d[2:7], d[7:11])
	case 10:
		return fmt.Sprintf("(%s) %s-%s", d[0:2], d[2:6], d[6:10])
	case 9:
		return fmt.Sprintf("%s-%s", d[0:5], d[5:9])
	case 8:
		return fmt.Sprintf("%s-%s", d[0:4], d[4:8])
	default:
		return strings.TrimSpace(phone)
	}
}

// NormalizePaymentMethod translates any English or legacy payment method into Portuguese
func NormalizePaymentMethod(method string) string {
	trimmed := strings.TrimSpace(method)
	lower := strings.ToLower(trimmed)
	switch lower {
	case "credit card", "credit_card", "cartao de credito", "cartão de crédito", "crédito", "credito":
		return "Cartão de Crédito"
	case "debit card", "debit_card", "cartao de debito", "cartão de débito", "débito", "debito":
		return "Cartão de Débito"
	case "cash", "dinheiro", "especie", "espécie":
		return "Dinheiro"
	case "pix":
		return "Pix"
	case "não pago", "nao pago", "nao_pago", "not paid", "not_paid", "pendente":
		return "Não pago"
	default:
		return trimmed
	}
}

// SanitizeCSVField prevents CSV Formula Injection (CWE-1236)
func SanitizeCSVField(val string) string {
	if len(val) == 0 {
		return ""
	}
	first := val[0]
	if first == '=' || first == '+' || first == '-' || first == '@' || first == '\t' || first == '\r' {
		return "'" + val
	}
	trimmed := strings.TrimSpace(val)
	if len(trimmed) > 0 {
		firstTrimmed := trimmed[0]
		if firstTrimmed == '=' || firstTrimmed == '+' || firstTrimmed == '-' || firstTrimmed == '@' {
			return "'" + val
		}
	}
	return val
}

func sanitizeRow(row []string) []string {
	sanitized := make([]string, len(row))
	for i, col := range row {
		sanitized[i] = SanitizeCSVField(col)
	}
	return sanitized
}

func formatJudges(dog clientdomain.Dog, photo *clientdomain.Photo) string {
	if photo != nil && len(photo.Judges) > 0 {
		return strings.Join(photo.Judges, ", ")
	}
	if len(dog.Judges) > 0 {
		return strings.Join(dog.Judges, ", ")
	}
	return dog.Judge
}

func formatIsOwner(isOwner *bool) string {
	if isOwner != nil {
		if *isOwner {
			return "Sim"
		}
		return "Não"
	}
	return "Sim"
}

func formatPhotoDate(photo *clientdomain.Photo, clientCreatedAt time.Time) string {
	if photo != nil && photo.CreatedAt != nil && !photo.CreatedAt.IsZero() {
		return photo.CreatedAt.Format("02/01/2006 15:04")
	}
	if !clientCreatedAt.IsZero() {
		return clientCreatedAt.Format("02/01/2006 15:04")
	}
	return ""
}

func (s *Service) GenerateClientsCSV(ctx context.Context, tenantID, userEmail, userName string) (string, error) {
	if tenantID == "" {
		return "", errors.New("tenant ID cannot be empty")
	}

	// 1. Fetch photographers to map IDs to names
	photographersList, err := s.photographerRepo.List(ctx, tenantID)
	if err != nil {
		log.Printf("[REPORT] Failed to list photographers for tenant %s: %v", tenantID, err)
		photographersList = nil
	}
	photogMap := make(map[string]string)
	for _, p := range photographersList {
		photogMap[p.ID] = p.Name
	}

	// 2. Cache persons dynamically during stream to avoid repeated identical queries
	personCache := make(map[string]*persondomain.Person)

	// 3. Prepare CSV buffer with updated headers
	var buf bytes.Buffer
	writer := csv.NewWriter(&buf)

	headers := []string{
		"Nome",
		"E-mail",
		"E-mail alternativo",
		"Telefone",
		"Dono do Cachorro",
		"Raça",
		"Juiz",
		"Competição Ganha",
		"Número do Arquivo da Foto",
		"Fotografo",
		"Forma de Pagamento",
		"Valor Pago",
		"Data da Foto",
	}
	if err := writer.Write(sanitizeRow(headers)); err != nil {
		return "", fmt.Errorf("failed to write csv headers: %w", err)
	}

	// 4. Stream clients from MongoDB
	streamErr := s.clientRepo.StreamByTenant(ctx, tenantID, func(c *clientdomain.SeasonClient) error {
		p, ok := personCache[c.PersonID]
		if !ok {
			personObj, err := s.personRepo.GetByID(ctx, c.PersonID, tenantID)
			if err != nil || personObj == nil {
				personObj = &persondomain.Person{
					Name: "Desconhecido",
				}
			}
			personCache[c.PersonID] = personObj
			p = personObj
		}

		formattedPhone := FormatPhone(p.Phone)

		if len(c.Dogs) == 0 {
			row := []string{
				p.Name,
				p.Email,
				p.AlternativeEmail,
				formattedPhone,
				"",
				"",
				"",
				"",
				"",
				"",
				"",
				"",
				"",
			}
			return writer.Write(sanitizeRow(row))
		}

		for _, dog := range c.Dogs {
			isOwnerStr := formatIsOwner(dog.IsOwner)
			numPhotos := len(dog.Photos)
			wonCompsList := dog.WonCompetitions
			numCompetitions := len(wonCompsList)
			if numCompetitions == 0 && dog.CompetitionsWon > 0 {
				numCompetitions = dog.CompetitionsWon
			}
			totalLinhas := max(numCompetitions, numPhotos)

			if totalLinhas == 0 {
				row := []string{
					p.Name,
					p.Email,
					p.AlternativeEmail,
					formattedPhone,
					isOwnerStr,
					dog.Breed,
					formatJudges(dog, nil),
					"",
					"",
					"",
					"",
					"",
					"",
				}
				if err := writer.Write(sanitizeRow(row)); err != nil {
					return err
				}
				continue
			}

			for i := 0; i < totalLinhas; i++ {
				var fileNumber, photographerName, paymentMethod, amountPaid, photoDate string
				var currentPhoto *clientdomain.Photo
				if numPhotos > 0 {
					var photo clientdomain.Photo
					if i < numPhotos {
						photo = dog.Photos[i]
					} else {
						photo = dog.Photos[numPhotos-1]
					}
					currentPhoto = &photo
					fileNumber = photo.FileNumber
					if name, exists := photogMap[photo.PhotographerID]; exists && name != "" {
						photographerName = name
					} else {
						photographerName = photo.PhotographerID
					}
					paymentMethod = NormalizePaymentMethod(photo.PaymentMethod)
					if photo.AmountPaid != nil {
						amountPaid = fmt.Sprintf("%.2f", *photo.AmountPaid)
					}
					photoDate = formatPhotoDate(&photo, c.CreatedAt)
				}

				var competitionWon string
				if len(wonCompsList) > 0 {
					if i < len(wonCompsList) {
						competitionWon = wonCompsList[i]
					} else {
						competitionWon = wonCompsList[len(wonCompsList)-1]
					}
				} else if dog.CompetitionsWon > 0 {
					competitionWon = "Sim"
				}

				row := []string{
					p.Name,
					p.Email,
					p.AlternativeEmail,
					formattedPhone,
					isOwnerStr,
					dog.Breed,
					formatJudges(dog, currentPhoto),
					competitionWon,
					fileNumber,
					photographerName,
					paymentMethod,
					amountPaid,
					photoDate,
				}
				if err := writer.Write(sanitizeRow(row)); err != nil {
					return err
				}
			}
		}

		writer.Flush()
		return writer.Error()
	})

	if streamErr != nil {
		return "", fmt.Errorf("error during client streaming: %w", streamErr)
	}

	writer.Flush()
	if err := writer.Error(); err != nil {
		return "", fmt.Errorf("error finishing csv writer: %w", err)
	}

	// 5. Store generated CSV in Storage Provider with isolated tenant path
	timestamp := time.Now().UTC().Unix()
	fileName := fmt.Sprintf("clientes_%d.csv", timestamp)
	relativePath := fmt.Sprintf("reports/tenant_%s/%s", tenantID, fileName)

	_, err = s.storageProvider.Save(ctx, relativePath, storageport.File{
		Name:        fileName,
		Data:        buf.Bytes(),
		ContentType: "text/csv; charset=utf-8",
	})
	if err != nil {
		return "", fmt.Errorf("failed to save report to storage: %w", err)
	}

	// 6. Send notification email with download link if userEmail is provided
	if userEmail != "" {
		downloadURL := fmt.Sprintf("%s/reports/download?file=%s", s.appBaseURL, url.QueryEscape(relativePath))
		if err := s.emailSender.SendReportReadyEmail(ctx, userEmail, userName, "Relatório de Clientes", downloadURL); err != nil {
			log.Printf("[REPORT-EMAIL-ERROR] Failed to send report ready email to %s: %v", userEmail, err)
		}
	}

	return relativePath, nil
}

func (s *Service) GenerateUnpaidClientsCSV(ctx context.Context, tenantID, userEmail, userName string) (string, error) {
	if tenantID == "" {
		return "", errors.New("tenant ID cannot be empty")
	}

	// 1. Fetch photographers to map IDs to names
	photographersList, err := s.photographerRepo.List(ctx, tenantID)
	if err != nil {
		log.Printf("[REPORT] Failed to list photographers for tenant %s: %v", tenantID, err)
		photographersList = nil
	}
	photogMap := make(map[string]string)
	for _, p := range photographersList {
		photogMap[p.ID] = p.Name
	}

	// 2. Cache persons dynamically during stream to avoid repeated identical queries
	personCache := make(map[string]*persondomain.Person)

	// 3. Prepare CSV buffer with headers
	var buf bytes.Buffer
	writer := csv.NewWriter(&buf)

	headers := []string{
		"Nome",
		"E-mail",
		"E-mail alternativo",
		"Telefone",
		"Raça",
		"Juiz",
		"Número do Arquivo da Foto",
		"Fotografo",
		"Status do Pagamento",
		"Valor Devido / Pago",
	}
	if err := writer.Write(sanitizeRow(headers)); err != nil {
		return "", fmt.Errorf("failed to write csv headers: %w", err)
	}

	// 4. Stream clients from MongoDB and filter unpaid photos
	streamErr := s.clientRepo.StreamByTenant(ctx, tenantID, func(c *clientdomain.SeasonClient) error {
		var personObj *persondomain.Person
		var ok bool

		for _, dog := range c.Dogs {
			for _, photo := range dog.Photos {
				normPay := NormalizePaymentMethod(photo.PaymentMethod)
				if normPay != "Não pago" && normPay != "" {
					continue
				}

				if personObj == nil {
					personObj, ok = personCache[c.PersonID]
					if !ok {
						p, err := s.personRepo.GetByID(ctx, c.PersonID, tenantID)
						if err != nil || p == nil {
							p = &persondomain.Person{
								Name: "Desconhecido",
							}
						}
						personCache[c.PersonID] = p
						personObj = p
					}
				}

				var photographerName string
				if name, exists := photogMap[photo.PhotographerID]; exists && name != "" {
					photographerName = name
				} else {
					photographerName = photo.PhotographerID
				}

				paymentStatus := normPay
				if paymentStatus == "" {
					paymentStatus = "Não pago"
				}

				var amount string
				if photo.AmountPaid != nil {
					amount = fmt.Sprintf("%.2f", *photo.AmountPaid)
				}

				judgeStr := formatJudges(dog, &photo)

				row := []string{
					personObj.Name,
					personObj.Email,
					personObj.AlternativeEmail,
					FormatPhone(personObj.Phone),
					dog.Breed,
					judgeStr,
					photo.FileNumber,
					photographerName,
					paymentStatus,
					amount,
				}
				if err := writer.Write(sanitizeRow(row)); err != nil {
					return err
				}
			}
		}

		writer.Flush()
		return writer.Error()
	})

	if streamErr != nil {
		return "", fmt.Errorf("error during client streaming: %w", streamErr)
	}

	writer.Flush()
	if err := writer.Error(); err != nil {
		return "", fmt.Errorf("error finishing csv writer: %w", err)
	}

	// 5. Store generated CSV in Storage Provider with isolated tenant path
	timestamp := time.Now().UTC().Unix()
	fileName := fmt.Sprintf("clientes_nao_pagos_%d.csv", timestamp)
	relativePath := fmt.Sprintf("reports/tenant_%s/%s", tenantID, fileName)

	_, err = s.storageProvider.Save(ctx, relativePath, storageport.File{
		Name:        fileName,
		Data:        buf.Bytes(),
		ContentType: "text/csv; charset=utf-8",
	})
	if err != nil {
		return "", fmt.Errorf("failed to save report to storage: %w", err)
	}

	// 6. Send notification email with download link if userEmail is provided
	if userEmail != "" {
		downloadURL := fmt.Sprintf("%s/reports/download?file=%s", s.appBaseURL, url.QueryEscape(relativePath))
		if err := s.emailSender.SendReportReadyEmail(ctx, userEmail, userName, "Relatório de Clientes Não Pagos", downloadURL); err != nil {
			log.Printf("[REPORT-EMAIL-ERROR] Failed to send report ready email to %s: %v", userEmail, err)
		}
	}

	return relativePath, nil
}

func fitPdfText(pdf *fpdf.Fpdf, text string, maxWidth float64) string {
	if pdf.GetStringWidth(text) <= maxWidth {
		return text
	}
	runes := []rune(text)
	for len(runes) > 0 && pdf.GetStringWidth(string(runes)+"...") > maxWidth {
		runes = runes[:len(runes)-1]
	}
	if len(runes) == 0 {
		return ""
	}
	return string(runes) + "..."
}

func (s *Service) buildClientsPDF(ctx context.Context, tenantID string) ([]byte, error) {
	if tenantID == "" {
		return nil, errors.New("tenant ID cannot be empty")
	}

	// Fetch photographers
	photographersList, err := s.photographerRepo.List(ctx, tenantID)
	if err != nil {
		photographersList = nil
	}
	photogMap := make(map[string]string)
	for _, p := range photographersList {
		photogMap[p.ID] = p.Name
	}

	// Collect clients
	personCache := make(map[string]*persondomain.Person)
	var clients []*clientdomain.SeasonClient
	err = s.clientRepo.StreamByTenant(ctx, tenantID, func(c *clientdomain.SeasonClient) error {
		clients = append(clients, c)
		if _, ok := personCache[c.PersonID]; !ok {
			personObj, pErr := s.personRepo.GetByID(ctx, c.PersonID, tenantID)
			if pErr != nil || personObj == nil {
				personObj = &persondomain.Person{Name: "Desconhecido"}
			}
			personCache[c.PersonID] = personObj
		}
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("failed to stream clients for pdf: %w", err)
	}

	// A4 Landscape: 297mm x 210mm. Margins: 10mm left/right -> 277mm usable width
	pdf := fpdf.New("L", "mm", "A4", "")
	pdf.SetMargins(10, 10, 10)
	pdf.SetAutoPageBreak(true, 12)
	tr := pdf.UnicodeTranslatorFromDescriptor("")

	colWidths := []float64{32, 40, 24, 24, 12, 32, 38, 16, 23, 18, 18}
	colHeaders := []string{
		"Nome", "E-mail", "Telefone", "Raça", "Dono", "Juiz",
		"Competições Vencidas", "Arquivo", "Forma de Pagamento", "Valor Pago", "Data da Foto",
	}

	pdf.SetHeaderFunc(func() {
		pdf.SetFont("Arial", "B", 12)
		pdf.SetTextColor(15, 23, 42)
		pdf.CellFormat(185, 6, tr("Relatório Consolidado de Clientes, Cães e Fotos"), "", 0, "L", false, 0, "")
		pdf.SetFont("Arial", "", 8)
		pdf.SetTextColor(100, 116, 139)
		pdf.CellFormat(92, 6, tr(fmt.Sprintf("Gerado em: %s", time.Now().Format("02/01/2006 15:04"))), "", 1, "R", false, 0, "")
		pdf.Ln(2)

		// Table Header Bar
		pdf.SetFillColor(30, 41, 59)
		pdf.SetTextColor(255, 255, 255)
		pdf.SetDrawColor(51, 65, 85)
		pdf.SetLineWidth(0.2)
		pdf.SetFont("Arial", "B", 7)

		for i, h := range colHeaders {
			align := "L"
			if i == 4 || i == 7 || i == 9 || i == 10 {
				align = "C"
			}
			pdf.CellFormat(colWidths[i], 6.5, tr(h), "1", 0, align, true, 0, "")
		}
		pdf.Ln(-1)
	})

	pdf.SetFooterFunc(func() {
		pdf.SetY(-9)
		pdf.SetFont("Arial", "I", 7)
		pdf.SetTextColor(148, 163, 184)
		pdf.CellFormat(0, 5, tr(fmt.Sprintf("Página %d/{nb}  •  Photo Storage", pdf.PageNo())), "", 0, "C", false, 0, "")
	})

	pdf.AliasNbPages("{nb}")
	pdf.AddPage()

	if len(clients) == 0 {
		pdf.SetFont("Arial", "I", 9)
		pdf.SetTextColor(100, 116, 139)
		pdf.Ln(10)
		pdf.CellFormat(277, 10, tr("Nenhum cliente ou foto encontrado para exportação."), "", 1, "C", false, 0, "")
		var buf bytes.Buffer
		if err := pdf.Output(&buf); err != nil {
			return nil, err
		}
		return buf.Bytes(), nil
	}

	pdf.SetFont("Arial", "", 7)
	pdf.SetDrawColor(226, 232, 240) // border color #e2e8f0
	pdf.SetLineWidth(0.15)

	for cIdx, client := range clients {
		p := personCache[client.PersonID]
		if p == nil {
			p = &persondomain.Person{Name: "Desconhecido"}
		}
		formattedPhone := FormatPhone(p.Phone)

		if len(client.Dogs) == 0 {
			pdf.SetTextColor(15, 23, 42)
			rowVals := []string{
				p.Name, p.Email, formattedPhone,
				"-", "-", "-", "-", "-", "-", "-", "-",
			}
			for i, val := range rowVals {
				align := "L"
				if i == 4 || i == 7 || i == 9 || i == 10 {
					align = "C"
				}
				fitted := fitPdfText(pdf, tr(val), colWidths[i]-2)
				pdf.CellFormat(colWidths[i], 5.5, fitted, "1", 0, align, false, 0, "")
			}
			pdf.Ln(-1)
		} else {
			for dIdx, dog := range client.Dogs {
				isOwnerStr := formatIsOwner(dog.IsOwner)
				judgeStr := formatJudges(dog, nil)
				wonComps := dog.WonCompetitions
				if len(wonComps) == 0 && dog.CompetitionsWon > 0 {
					wonComps = []string{"Sim"}
				}
				numPhotos := len(dog.Photos)
				totalRows := max(len(wonComps), numPhotos)
				if totalRows == 0 {
					totalRows = 1
				}

				for rIdx := 0; rIdx < totalRows; rIdx++ {
					var colName, colEmail, colPhone, colBreed, colOwner, colJudge, colComp, colFile, colPayment, colAmount, colDate string

					// Show person info only on the very first row of the very first dog for this client
					if dIdx == 0 && rIdx == 0 {
						colName = p.Name
						colEmail = p.Email
						colPhone = formattedPhone
					}

					// Show dog info only on the first row of this dog
					if rIdx == 0 {
						colBreed = dog.Breed
						colOwner = isOwnerStr
						colJudge = judgeStr
					}

					// Won competition on current row index
					if rIdx < len(wonComps) {
						colComp = wonComps[rIdx]
					}

					// Photo info on current row index
					if rIdx < numPhotos {
						photo := dog.Photos[rIdx]
						colFile = photo.FileNumber
						colPayment = NormalizePaymentMethod(photo.PaymentMethod)
						if photo.AmountPaid != nil {
							colAmount = fmt.Sprintf("R$ %.2f", *photo.AmountPaid)
						}
						colDate = formatPhotoDate(&photo, client.CreatedAt)
						if len(photo.Judges) > 0 && rIdx > 0 {
							colJudge = strings.Join(photo.Judges, ", ")
						}
					}

					pdf.SetTextColor(30, 41, 59)
					rowVals := []string{
						colName, colEmail, colPhone,
						colBreed, colOwner, colJudge,
						colComp, colFile, colPayment, colAmount, colDate,
					}

					for i, val := range rowVals {
						align := "L"
						if i == 4 || i == 7 || i == 9 || i == 10 {
							align = "C"
						}
						fitted := fitPdfText(pdf, tr(val), colWidths[i]-2)
						pdf.CellFormat(colWidths[i], 5.5, fitted, "1", 0, align, false, 0, "")
					}
					pdf.Ln(-1)
				}

				// Draw a subtle line between dogs of the same client
				if dIdx < len(client.Dogs)-1 {
					pdf.SetDrawColor(203, 213, 225)
					pdf.SetLineWidth(0.1)
					x := pdf.GetX()
					y := pdf.GetY()
					pdf.Line(x+colWidths[0]+colWidths[1]+colWidths[2], y, x+277, y)
					pdf.SetDrawColor(226, 232, 240)
					pdf.SetLineWidth(0.15)
				}
			}
		}

		// Draw a solid divider line between distinct clients
		if cIdx < len(clients)-1 {
			pdf.SetDrawColor(100, 116, 139)
			pdf.SetLineWidth(0.35)
			x := pdf.GetX()
			y := pdf.GetY()
			pdf.Line(x, y, x+277, y)
			pdf.SetDrawColor(226, 232, 240)
			pdf.SetLineWidth(0.15)
		}
	}

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("failed to render pdf output: %w", err)
	}

	return buf.Bytes(), nil
}

func (s *Service) GenerateClientsPDF(ctx context.Context, tenantID, userEmail, userName string) (string, error) {
	pdfBytes, err := s.buildClientsPDF(ctx, tenantID)
	if err != nil {
		return "", err
	}

	timestamp := time.Now().UTC().Unix()
	fileName := fmt.Sprintf("clientes_%d.pdf", timestamp)
	relativePath := fmt.Sprintf("reports/tenant_%s/%s", tenantID, fileName)

	_, err = s.storageProvider.Save(ctx, relativePath, storageport.File{
		Name:        fileName,
		Data:        pdfBytes,
		ContentType: "application/pdf",
	})
	if err != nil {
		return "", fmt.Errorf("failed to save pdf report to storage: %w", err)
	}

	if userEmail != "" {
		downloadURL := fmt.Sprintf("%s/reports/download?file=%s", s.appBaseURL, url.QueryEscape(relativePath))
		if err := s.emailSender.SendReportReadyEmail(ctx, userEmail, userName, "Relatório de Clientes (PDF)", downloadURL); err != nil {
			log.Printf("[REPORT-EMAIL-ERROR] Failed to send PDF report ready email to %s: %v", userEmail, err)
		}
	}

	return relativePath, nil
}

func (s *Service) GenerateDirectClientsPDF(ctx context.Context, tenantID string) ([]byte, error) {
	return s.buildClientsPDF(ctx, tenantID)
}

func (s *Service) GetReportFile(ctx context.Context, tenantID, relativePath string) ([]byte, error) {
	cleanPath := filepath.Clean(strings.TrimPrefix(relativePath, "/"))
	if strings.Contains(cleanPath, "..") {
		return nil, ErrInvalidReportPath
	}

	expectedPrefix := fmt.Sprintf("reports/tenant_%s/", tenantID)
	if !strings.HasPrefix(cleanPath, expectedPrefix) {
		return nil, ErrUnauthorizedTenant
	}

	return s.storageProvider.Get(ctx, cleanPath)
}
