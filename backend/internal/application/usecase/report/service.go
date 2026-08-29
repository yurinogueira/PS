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

	// 3. Prepare CSV buffer with headers
	var buf bytes.Buffer
	writer := csv.NewWriter(&buf)

	headers := []string{
		"Nome",
		"E-mail",
		"E-mail alternativo",
		"Telefone",
		"Número do Arquivo da Foto",
		"Fotografo",
		"Competição Ganha",
		"Juiz",
		"Forma de Pagamento",
		"Raça",
		"Valor Pago",
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
			}
			return writer.Write(sanitizeRow(row))
		}

		for _, dog := range c.Dogs {
			numPhotos := len(dog.Photos)
			wonCompsList := dog.WonCompetitions
			numCompetitions := len(wonCompsList)
			if numCompetitions == 0 {
				numCompetitions = dog.CompetitionsWon
			}
			totalLinhas := max(numCompetitions, numPhotos)

			if totalLinhas == 0 {
				row := []string{
					p.Name,
					p.Email,
					p.AlternativeEmail,
					formattedPhone,
					"",
					"",
					"",
					dog.Judge,
					"",
					dog.Breed,
					"",
				}
				if err := writer.Write(sanitizeRow(row)); err != nil {
					return err
				}
				continue
			}

			for i := 0; i < totalLinhas; i++ {
				var fileNumber, photographerName, paymentMethod, amountPaid string
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
					if photo.AmountPaid != nil {
						amountPaid = fmt.Sprintf("%.2f", *photo.AmountPaid)
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
					fileNumber,
					photographerName,
					competitionWon,
					dog.Judge,
					paymentMethod,
					dog.Breed,
					amountPaid,
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

				row := []string{
					personObj.Name,
					personObj.Email,
					personObj.AlternativeEmail,
					FormatPhone(personObj.Phone),
					dog.Breed,
					dog.Judge,
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
