---
type: domain
title: "Subdomínio: Relatórios e Exportações Assíncronas (Report)"
description: "Processamento assíncrono de relatórios CSV e PDF, jobs em background, streaming e retenção por TTL."
tags:
  - domain
  - report
  - export
  - csv
  - pdf
  - streaming
  - async
resource: backend/internal/domain/report
timestamp: 2026-10-09
---

# 📊 Subdomínio: Relatórios e Exportações Assíncronas (Report)

O subdomínio de **Report** gerencia a fila de geração e download seguro de relatórios analíticos no **PS (Photo Storage)**.

Para navegação geral, retorne ao [Catálogo Canônico](../index.md).

---

## 🧩 Modelo de Domínio (`ReportJob` & `ReportType`)

Estruturado em `backend/internal/domain/report/report.go`:

```go
type Status string

const (
    StatusPending    Status = "pending"
    StatusProcessing Status = "processing"
    StatusCompleted  Status = "completed"
    StatusFailed     Status = "failed"
    StatusExpired    Status = "expired" // Expiração após retenção TTL (30 dias)
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
    ExpiresAt   *time.Time     `json:"expires_at,omitempty" bson:"expires_at,omitempty"`
    ExpiredAt   *time.Time     `json:"expired_at,omitempty" bson:"expired_at,omitempty"`
    DurationMS  int64          `json:"duration_ms,omitempty" bson:"duration_ms,omitempty"`
}
```

---

## 📋 Regras de Negócio e Performance

1. **Execução Não-Bloqueante**: Grandes extrações de clientes não bloqueiam requisições HTTP REST. O cliente inicia a solicitação recebendo um `job_id` e monitora o status (`pending` -> `processing` -> `completed`).
2. **Streaming com Baixo Consumo de Memória**: O gerador em Go lê os registros do MongoDB utilizando cursors iterativos (`mongo.Cursor`), formatando as linhas do CSV diretamente no buffer de saída sem carregar o dataset completo na memória RAM.
3. **Expiração Automática e Limpeza por TTL (30 dias)**: Arquivos gerados possuem prazo de validade de 30 dias (`ExpiresAt`). Uma rotina leve em background (`StartReportCleanupWorker`) executada diariamente varre os registros concluídos com mais de 30 dias utilizando índices `{ status: 1, created_at: 1 }` e `{ tenant_id: 1, file_path: 1 }` em batches de 50 itens, valida estritamente o isolamento multi-tenant (`reports/tenant_{tenantID}/...`) prevenindo path traversal antes de deletar arquivos físicos (`storageProvider.Delete`), diferencia erros transitórios de ausência benigna, e atualiza o status do job para `expired` com `expired_at`. Requisições de download de arquivos expirados retornam HTTP 410 (Gone). O encerramento da API (`App.Close`) aguarda graciosamente (`sync.WaitGroup`) os ciclos em andamento antes de desconectar o banco.
4. **Formatação Multimoeda (`FormatPaidAmount`)**: A coluna de valor pago suporta `BRL` (`R$`), `USD` (`$`) e `OTHER` (`Outro`), exibindo os valores com formatação monetária padronizada sem distorções de decimais.
5. **Priorização de Competições da Foto**: O relatório prioriza as competições específicas da foto (`photo.Competitions`); caso ausentes, adota as competições do cão (`dog.WonCompetitions`) como fallback retroativo.
6. **Sanitização de CSV**: Células com caracteres de controle ou injeção de fórmulas CSV são higienizadas para leitura segura no Excel.

---

## 🔗 Referências Cruzadas
- [Catálogo Canônico](../index.md)
- [Armazenamento e Gestão de Mídia](../architecture/storage-and-media.md)
- [Subdomínio de Clientes (Client)](client.md)
- [Subdomínio de Inquilinos (Tenant)](tenant.md)
