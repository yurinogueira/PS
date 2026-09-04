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
	"go.mongodb.org/mongo-driver/v2/bson"

	clientport "ps/internal/application/ports/client"
	emailport "ps/internal/application/ports/email"
	personport "ps/internal/application/ports/person"
	photographerport "ps/internal/application/ports/photographer"
	reportport "ps/internal/application/ports/report"
	seasonport "ps/internal/application/ports/season"
	storageport "ps/internal/application/ports/storage"
	tenantport "ps/internal/application/ports/tenant"
	clientdomain "ps/internal/domain/client"
	persondomain "ps/internal/domain/person"
	reportdomain "ps/internal/domain/report"
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
	tenantValidator  tenantport.Validator
	reportRepo       reportport.Repository
	seasonRepo       seasonport.Repository
	appBaseURL       string
}

func NewService(
	clientRepo clientport.Repository,
	personRepo personport.Repository,
	photographerRepo photographerport.Repository,
	storageProvider storageport.Provider,
	emailSender emailport.Sender,
	appBaseURL string,
	validator ...tenantport.Validator,
) *Service {
	if appBaseURL == "" {
		appBaseURL = "http://localhost:8080"
	}
	var tv tenantport.Validator
	if len(validator) > 0 {
		tv = validator[0]
	}
	return &Service{
		clientRepo:       clientRepo,
		personRepo:       personRepo,
		photographerRepo: photographerRepo,
		storageProvider:  storageProvider,
		emailSender:      emailSender,
		tenantValidator:  tv,
		appBaseURL:       strings.TrimRight(appBaseURL, "/"),
	}
}

func (s *Service) WithReportRepo(repo reportport.Repository) *Service {
	s.reportRepo = repo
	return s
}

func (s *Service) WithSeasonRepo(repo seasonport.Repository) *Service {
	s.seasonRepo = repo
	return s
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

// FormatPaidAmount formats the amount paid with the proper currency symbol ($ for USD, R$ for BRL / default)
func FormatPaidAmount(amount *float64, currency string) string {
	if amount == nil {
		return ""
	}
	symbol := "R$"
	if strings.ToUpper(strings.TrimSpace(currency)) == "USD" {
		symbol = "$"
	}
	return fmt.Sprintf("%s %.2f", symbol, *amount)
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

func formatJudges(photo *clientdomain.Photo) string {
	if photo == nil || len(photo.Judges) == 0 {
		return ""
	}
	return strings.Join(photo.Judges, ", ")
}

func formatJudgesPDF(photo *clientdomain.Photo) string {
	if photo == nil || len(photo.Judges) == 0 {
		return ""
	}
	return strings.Join(photo.Judges, "\n")
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

func (s *Service) GenerateClientsCSV(ctx context.Context, tenantID, seasonID, userEmail, userName string) (string, error) {
	if tenantID == "" {
		return "", errors.New("tenant ID cannot be empty")
	}

	if s.tenantValidator != nil {
		if err := s.tenantValidator.ValidateCanExportReport(ctx, tenantID, seasonID); err != nil {
			return "", err
		}
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

	// 3. Prepare CSV buffer with UTF-8 BOM for Excel compatibility and updated headers
	var buf bytes.Buffer
	buf.WriteString("\xEF\xBB\xBF")
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
	streamErr := s.clientRepo.StreamByTenant(ctx, tenantID, seasonID, func(c *clientdomain.SeasonClient) error {
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
					"",
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
				var fileNumber, photographerName, paymentMethod, amountPaid, photoDate, judgeStr string
				if numPhotos > 0 {
					var photo clientdomain.Photo
					if i < numPhotos {
						photo = dog.Photos[i]
					} else {
						photo = dog.Photos[numPhotos-1]
					}
					fileNumber = photo.FileNumber
					if name, exists := photogMap[photo.PhotographerID]; exists && name != "" {
						photographerName = name
					} else {
						photographerName = photo.PhotographerID
					}
					paymentMethod = NormalizePaymentMethod(photo.PaymentMethod)
					amountPaid = FormatPaidAmount(photo.AmountPaid, photo.Currency)
					photoDate = formatPhotoDate(&photo, c.CreatedAt)
					if i < numPhotos {
						judgeStr = formatJudges(&photo)
					}
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
					judgeStr,
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

func (s *Service) GenerateUnpaidClientsCSV(ctx context.Context, tenantID, seasonID, userEmail, userName string) (string, error) {
	if tenantID == "" {
		return "", errors.New("tenant ID cannot be empty")
	}

	if s.tenantValidator != nil {
		if err := s.tenantValidator.ValidateCanExportReport(ctx, tenantID, seasonID); err != nil {
			return "", err
		}
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

	// 3. Prepare CSV buffer with UTF-8 BOM for Excel compatibility and headers
	var buf bytes.Buffer
	buf.WriteString("\xEF\xBB\xBF")
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
	streamErr := s.clientRepo.StreamByTenant(ctx, tenantID, seasonID, func(c *clientdomain.SeasonClient) error {
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

				amount := FormatPaidAmount(photo.AmountPaid, photo.Currency)

				judgeStr := formatJudges(&photo)

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

func (s *Service) GeneratePaidClientsCSV(ctx context.Context, tenantID, seasonID, userEmail, userName string) (string, error) {
	if tenantID == "" {
		return "", errors.New("tenant ID cannot be empty")
	}

	if s.tenantValidator != nil {
		if err := s.tenantValidator.ValidateCanExportReport(ctx, tenantID, seasonID); err != nil {
			return "", err
		}
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

	// 3. Prepare CSV buffer with UTF-8 BOM for Excel compatibility and headers
	var buf bytes.Buffer
	buf.WriteString("\xEF\xBB\xBF")
	writer := csv.NewWriter(&buf)

	headers := []string{
		"Nome",
		"E-mail",
		"E-mail alternativo",
		"Telefone",
		"Dono",
		"Raça",
		"Juiz",
		"Competições Vencidas",
		"Número do Arquivo da Foto",
		"Fotografo",
		"Forma de Pagamento",
		"Valor Pago",
		"Data da Foto",
	}
	if err := writer.Write(sanitizeRow(headers)); err != nil {
		return "", fmt.Errorf("failed to write csv headers: %w", err)
	}

	// 4. Stream clients from MongoDB and filter paid photos
	streamErr := s.clientRepo.StreamByTenant(ctx, tenantID, seasonID, func(c *clientdomain.SeasonClient) error {
		var personObj *persondomain.Person
		var ok bool

		for _, dog := range c.Dogs {
			isOwnerStr := formatIsOwner(dog.IsOwner)
			var wonCompStr string
			if len(dog.WonCompetitions) > 0 {
				wonCompStr = strings.Join(dog.WonCompetitions, ", ")
			} else if dog.CompetitionsWon > 0 {
				wonCompStr = "Sim"
			}

			for _, photo := range dog.Photos {
				normPay := NormalizePaymentMethod(photo.PaymentMethod)
				if normPay == "Não pago" || normPay == "" {
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

				amountPaid := FormatPaidAmount(photo.AmountPaid, photo.Currency)
				photoDate := formatPhotoDate(&photo, c.CreatedAt)
				judgeStr := formatJudges(&photo)

				row := []string{
					personObj.Name,
					personObj.Email,
					personObj.AlternativeEmail,
					FormatPhone(personObj.Phone),
					isOwnerStr,
					dog.Breed,
					judgeStr,
					wonCompStr,
					photo.FileNumber,
					photographerName,
					normPay,
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
	fileName := fmt.Sprintf("clientes_pagos_%d.csv", timestamp)
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
		if err := s.emailSender.SendReportReadyEmail(ctx, userEmail, userName, "Relatório de Clientes Pagos", downloadURL); err != nil {
			log.Printf("[REPORT-EMAIL-ERROR] Failed to send report ready email to %s: %v", userEmail, err)
		}
	}

	return relativePath, nil
}

func renderPdfRow(pdf *fpdf.Fpdf, tr func(string) string, colWidths []float64, rowVals []string, aligns []string, lineHeight float64, pageHeight float64, bottomMargin float64) {
	if tr == nil {
		tr = func(s string) string { return s }
	}

	numCols := len(colWidths)
	colLines := make([][]string, numCols)
	maxLines := 1

	for i := 0; i < numCols; i++ {
		val := ""
		if i < len(rowVals) {
			val = rowVals[i]
		}
		if strings.TrimSpace(val) == "" {
			colLines[i] = []string{""}
			continue
		}

		usableWidth := colWidths[i] - 2.0
		if usableWidth < 1.0 {
			usableWidth = colWidths[i]
		}

		var lines []string
		rawParts := strings.Split(val, "\n")
		for _, part := range rawParts {
			trimmedPart := strings.TrimSpace(part)
			if trimmedPart == "" {
				lines = append(lines, "")
				continue
			}
			translated := tr(trimmedPart)
			splitLines := pdf.SplitLines([]byte(translated), usableWidth)
			if len(splitLines) == 0 {
				lines = append(lines, translated)
			} else {
				for _, sl := range splitLines {
					lines = append(lines, string(sl))
				}
			}
		}

		if len(lines) == 0 {
			lines = []string{""}
		}
		colLines[i] = lines
		if len(lines) > maxLines {
			maxLines = len(lines)
		}
	}

	rowHeight := float64(maxLines) * lineHeight

	// Check page break (210mm A4 landscape - bottomMargin)
	if pdf.GetY()+rowHeight > (pageHeight - bottomMargin) {
		pdf.AddPage()
	}

	startX := pdf.GetX()
	startY := pdf.GetY()

	// Draw each cell
	currentX := startX
	for i := 0; i < numCols; i++ {
		align := "L"
		if i < len(aligns) && aligns[i] != "" {
			align = aligns[i]
		}

		// Draw border box
		pdf.Rect(currentX, startY, colWidths[i], rowHeight, "D")

		// Render text lines inside the cell
		for lIdx, lineText := range colLines[i] {
			pdf.SetXY(currentX+1.0, startY+float64(lIdx)*lineHeight)
			pdf.CellFormat(colWidths[i]-2.0, lineHeight, lineText, "", 0, align, false, 0, "")
		}

		currentX += colWidths[i]
	}

	// Move cursor to bottom of the row
	pdf.SetXY(startX, startY+rowHeight)
}

func (s *Service) buildClientsPDF(ctx context.Context, tenantID, seasonID string, filters *reportdomain.ReportFilters) ([]byte, error) {
	if tenantID == "" {
		return nil, errors.New("tenant ID cannot be empty")
	}

	if s.tenantValidator != nil {
		if err := s.tenantValidator.ValidateCanExportReport(ctx, tenantID, seasonID); err != nil {
			return nil, err
		}
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

	// Prepare payment filter structures
	allowedMethodsMap := make(map[string]bool)
	if filters != nil && len(filters.PaymentMethods) > 0 {
		for _, m := range filters.PaymentMethods {
			norm := strings.ToLower(NormalizePaymentMethod(m))
			allowedMethodsMap[norm] = true
		}
	}
	hasFilter := filters != nil && (filters.IsPaid != nil || len(allowedMethodsMap) > 0)

	// Collect clients
	personCache := make(map[string]*persondomain.Person)
	var clients []*clientdomain.SeasonClient
	err = s.clientRepo.StreamByTenant(ctx, tenantID, seasonID, func(c *clientdomain.SeasonClient) error {
		if hasFilter {
			var filteredDogs []clientdomain.Dog
			for _, dog := range c.Dogs {
				var filteredPhotos []clientdomain.Photo
				for _, photo := range dog.Photos {
					normPay := NormalizePaymentMethod(photo.PaymentMethod)
					isPaid := normPay != "Não pago" && normPay != ""

					if filters.IsPaid != nil {
						if *filters.IsPaid && !isPaid {
							continue
						}
						if !*filters.IsPaid && isPaid {
							continue
						}
					}

					if len(allowedMethodsMap) > 0 {
						if !allowedMethodsMap[strings.ToLower(normPay)] {
							continue
						}
					}

					filteredPhotos = append(filteredPhotos, photo)
				}

				if len(filteredPhotos) > 0 {
					dogCopy := dog
					dogCopy.Photos = filteredPhotos
					filteredDogs = append(filteredDogs, dogCopy)
				}
			}

			if len(filteredDogs) > 0 {
				clientCopy := *c
				clientCopy.Dogs = filteredDogs
				clients = append(clients, &clientCopy)
				if _, ok := personCache[c.PersonID]; !ok {
					personObj, pErr := s.personRepo.GetByID(ctx, c.PersonID, tenantID)
					if pErr != nil || personObj == nil {
						personObj = &persondomain.Person{Name: "Desconhecido"}
					}
					personCache[c.PersonID] = personObj
				}
			}
			return nil
		}

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

	// Columns without "Dono" (Total = 277mm)
	colWidths := []float64{32, 42, 24, 30, 36, 42, 16, 22, 16, 17}
	colHeaders := []string{
		"Nome", "E-mail", "Telefone", "Raça", "Juiz",
		"Competições Vencidas", "Arquivo", "Forma de Pagamento", "Valor Pago", "Data da Foto",
	}
	aligns := []string{"L", "L", "L", "L", "L", "L", "C", "C", "C", "C"}

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
			if aligns[i] == "C" {
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
	pdf.SetTextColor(30, 41, 59)

	lineHeight := 4.2
	pageHeight := 210.0
	bottomMargin := 12.0

	for cIdx, client := range clients {
		p := personCache[client.PersonID]
		if p == nil {
			p = &persondomain.Person{Name: "Desconhecido"}
		}
		formattedPhone := FormatPhone(p.Phone)

		if len(client.Dogs) == 0 {
			rowVals := []string{
				p.Name, p.Email, formattedPhone,
				"-", "-", "-", "-", "-", "-", "-",
			}
			renderPdfRow(pdf, tr, colWidths, rowVals, aligns, lineHeight, pageHeight, bottomMargin)
		} else {
			for dIdx, dog := range client.Dogs {
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
					var colName, colEmail, colPhone, colBreed, colJudge, colComp, colFile, colPayment, colAmount, colDate string

					// Show person info only on the very first row of the very first dog for this client
					if dIdx == 0 && rIdx == 0 {
						colName = p.Name
						colEmail = p.Email
						colPhone = formattedPhone
					}

					// Show dog breed only on the first row of this dog
					if rIdx == 0 {
						colBreed = dog.Breed
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
						colAmount = FormatPaidAmount(photo.AmountPaid, photo.Currency)
						colDate = formatPhotoDate(&photo, client.CreatedAt)
						colJudge = formatJudgesPDF(&photo)
					}

					rowVals := []string{
						colName, colEmail, colPhone,
						colBreed, colJudge,
						colComp, colFile, colPayment, colAmount, colDate,
					}

					renderPdfRow(pdf, tr, colWidths, rowVals, aligns, lineHeight, pageHeight, bottomMargin)
				}
			}
		}

		// Draw a solid divider line between distinct clients if not at the end
		if cIdx < len(clients)-1 {
			pdf.SetDrawColor(100, 116, 139)
			pdf.SetLineWidth(0.35)
			x := pdf.GetX()
			y := pdf.GetY()
			if y < (pageHeight - bottomMargin) {
				pdf.Line(x, y, x+277, y)
			}
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

func (s *Service) GenerateClientsPDF(ctx context.Context, tenantID, seasonID, userEmail, userName string) (string, error) {
	pdfBytes, err := s.buildClientsPDF(ctx, tenantID, seasonID, nil)
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

func (s *Service) GenerateDynamicPaymentPDF(ctx context.Context, tenantID, seasonID string, filters *reportdomain.ReportFilters, userEmail, userName string) (string, error) {
	pdfBytes, err := s.buildClientsPDF(ctx, tenantID, seasonID, filters)
	if err != nil {
		return "", err
	}

	timestamp := time.Now().UTC().Unix()
	fileName := fmt.Sprintf("clientes_dinamico_%d.pdf", timestamp)
	relativePath := fmt.Sprintf("reports/tenant_%s/%s", tenantID, fileName)

	_, err = s.storageProvider.Save(ctx, relativePath, storageport.File{
		Name:        fileName,
		Data:        pdfBytes,
		ContentType: "application/pdf",
	})
	if err != nil {
		return "", fmt.Errorf("failed to save dynamic pdf report to storage: %w", err)
	}

	if userEmail != "" {
		downloadURL := fmt.Sprintf("%s/reports/download?file=%s", s.appBaseURL, url.QueryEscape(relativePath))
		if err := s.emailSender.SendReportReadyEmail(ctx, userEmail, userName, "Relatório Dinâmico de Clientes (PDF)", downloadURL); err != nil {
			log.Printf("[REPORT-EMAIL-ERROR] Failed to send dynamic PDF report ready email to %s: %v", userEmail, err)
		}
	}

	return relativePath, nil
}

func (s *Service) ValidateAccess(ctx context.Context, tenantID, seasonID string) error {
	if s.tenantValidator != nil {
		return s.tenantValidator.ValidateCanExportReport(ctx, tenantID, seasonID)
	}
	return nil
}

func (s *Service) GenerateDirectClientsPDF(ctx context.Context, tenantID, seasonID string) ([]byte, error) {
	return s.buildClientsPDF(ctx, tenantID, seasonID, nil)
}

func (s *Service) GetReportFile(ctx context.Context, tenantID, relativePath string) ([]byte, error) {
	if s.tenantValidator != nil {
		if err := s.tenantValidator.ValidateCanExportReport(ctx, tenantID, ""); err != nil {
			return nil, err
		}
	}

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

func (s *Service) GenerateDynamicPaymentCSV(ctx context.Context, tenantID, seasonID string, filters *reportdomain.ReportFilters, userEmail, userName string) (string, error) {
	if tenantID == "" {
		return "", errors.New("tenant ID cannot be empty")
	}

	if s.tenantValidator != nil {
		if err := s.tenantValidator.ValidateCanExportReport(ctx, tenantID, seasonID); err != nil {
			return "", err
		}
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

	// Build map of allowed normalized payment methods if specified
	allowedMethodsMap := make(map[string]bool)
	if filters != nil && len(filters.PaymentMethods) > 0 {
		for _, m := range filters.PaymentMethods {
			norm := strings.ToLower(NormalizePaymentMethod(m))
			allowedMethodsMap[norm] = true
		}
	}

	// 3. Prepare CSV buffer with UTF-8 BOM for Excel compatibility and headers
	var buf bytes.Buffer
	buf.WriteString("\xEF\xBB\xBF")
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

	// 4. Stream clients from MongoDB and apply dynamic filters
	streamErr := s.clientRepo.StreamByTenant(ctx, tenantID, seasonID, func(c *clientdomain.SeasonClient) error {
		var personObj *persondomain.Person
		var ok bool

		for _, dog := range c.Dogs {
			isOwnerStr := formatIsOwner(dog.IsOwner)
			var wonCompStr string
			if len(dog.WonCompetitions) > 0 {
				wonCompStr = strings.Join(dog.WonCompetitions, ", ")
			} else if dog.CompetitionsWon > 0 {
				wonCompStr = "Sim"
			}

			for _, photo := range dog.Photos {
				normPay := NormalizePaymentMethod(photo.PaymentMethod)
				isPaid := normPay != "Não pago" && normPay != ""

				// Filter by payment status
				if filters != nil && filters.IsPaid != nil {
					if *filters.IsPaid && !isPaid {
						continue
					}
					if !*filters.IsPaid && isPaid {
						continue
					}
				}

				// Filter by payment methods if specified
				if len(allowedMethodsMap) > 0 {
					if !allowedMethodsMap[strings.ToLower(normPay)] {
						continue
					}
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

				amountPaid := FormatPaidAmount(photo.AmountPaid, photo.Currency)
				photoDate := formatPhotoDate(&photo, c.CreatedAt)
				judgeStr := formatJudges(&photo)

				row := []string{
					personObj.Name,
					personObj.Email,
					personObj.AlternativeEmail,
					FormatPhone(personObj.Phone),
					isOwnerStr,
					dog.Breed,
					judgeStr,
					wonCompStr,
					photo.FileNumber,
					photographerName,
					normPay,
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
	fileName := fmt.Sprintf("clientes_dinamico_%d.csv", timestamp)
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
		if err := s.emailSender.SendReportReadyEmail(ctx, userEmail, userName, "Relatório Dinâmico de Clientes", downloadURL); err != nil {
			log.Printf("[REPORT-EMAIL-ERROR] Failed to send report ready email to %s: %v", userEmail, err)
		}
	}

	return relativePath, nil
}

func (s *Service) StartJob(ctx context.Context, job *reportdomain.ReportJob) (*reportdomain.ReportJob, error) {
	if job.TenantID == "" {
		return nil, errors.New("tenant ID cannot be empty")
	}

	if s.tenantValidator != nil {
		if err := s.tenantValidator.ValidateCanExportReport(ctx, job.TenantID, job.SeasonID); err != nil {
			return nil, err
		}
	}

	if job.ID == "" {
		job.ID = bson.NewObjectID().Hex()
	}
	if job.CreatedAt.IsZero() {
		job.CreatedAt = time.Now().UTC()
	}
	if job.Status == "" {
		job.Status = reportdomain.StatusPending
	}

	if job.SeasonID != "" && job.SeasonName == "" && s.seasonRepo != nil {
		if season, err := s.seasonRepo.GetByID(ctx, job.SeasonID, job.TenantID); err == nil && season != nil {
			job.SeasonName = season.Name
		}
	}
	if job.SeasonID == "" && job.SeasonName == "" {
		job.SeasonName = "Todos os Eventos"
	}

	if s.reportRepo != nil {
		if err := s.reportRepo.Create(ctx, job); err != nil {
			return nil, fmt.Errorf("failed to create report job: %w", err)
		}
	}

	// Launch async extraction job in background goroutine with detached context
	go func(j *reportdomain.ReportJob) {
		jobCtx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
		defer cancel()

		start := time.Now()
		j.Status = reportdomain.StatusProcessing
		if s.reportRepo != nil {
			_ = s.reportRepo.Update(jobCtx, j)
		}

		var filePath string
		var genErr error

		userEmail := j.RequestedBy.UserEmail
		if userEmail == "" {
			userEmail = j.UserEmail
		}
		userName := j.RequestedBy.UserName
		if userName == "" {
			userName = j.UserName
		}

		switch j.Type {
		case reportdomain.TypeClientsCSV:
			filePath, genErr = s.GenerateClientsCSV(jobCtx, j.TenantID, j.SeasonID, userEmail, userName)
		case reportdomain.TypeUnpaidClientsCSV:
			filePath, genErr = s.GenerateUnpaidClientsCSV(jobCtx, j.TenantID, j.SeasonID, userEmail, userName)
		case reportdomain.TypePaidClientsCSV:
			filePath, genErr = s.GeneratePaidClientsCSV(jobCtx, j.TenantID, j.SeasonID, userEmail, userName)
		case reportdomain.TypeClientsPDF:
			filePath, genErr = s.GenerateClientsPDF(jobCtx, j.TenantID, j.SeasonID, userEmail, userName)
		case reportdomain.TypeDynamicPayment:
			filePath, genErr = s.GenerateDynamicPaymentPDF(jobCtx, j.TenantID, j.SeasonID, j.Filters, userEmail, userName)
		default:
			genErr = fmt.Errorf("unsupported report type: %s", j.Type)
		}

		completed := time.Now().UTC()
		j.CompletedAt = &completed
		j.DurationMS = time.Since(start).Milliseconds()

		if genErr != nil {
			j.Status = reportdomain.StatusFailed
			j.Error = genErr.Error()
			log.Printf("[REPORT-JOB-ERROR] Job %s failed: %v", j.ID, genErr)
		} else {
			j.Status = reportdomain.StatusCompleted
			j.FilePath = filePath
		}

		if s.reportRepo != nil {
			_ = s.reportRepo.Update(jobCtx, j)
		}
	}(job)

	return job, nil
}

func (s *Service) ListJobs(ctx context.Context, filter reportport.ListFilter) (*reportport.ListResult, error) {
	if s.reportRepo == nil {
		return &reportport.ListResult{Jobs: make([]*reportdomain.ReportJob, 0)}, nil
	}
	return s.reportRepo.List(ctx, filter)
}

func (s *Service) GetJob(ctx context.Context, id, tenantID string) (*reportdomain.ReportJob, error) {
	if s.reportRepo == nil {
		return nil, errors.New("report repository not configured")
	}
	return s.reportRepo.GetByID(ctx, id, tenantID)
}
