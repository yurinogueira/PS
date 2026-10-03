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
timestamp: 2026-10-02
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
```

---

## 📋 Regras de Negócio e Performance

1. **Execução Não-Bloqueante**: Grandes extrações de clientes não bloqueiam requisições HTTP REST. O cliente inicia a solicitação recebendo um `job_id` e monitora o status (`pending` -> `processing` -> `completed`).
2. **Streaming com Baixo Consumo de Memória**: O gerador em Go lê os registros do MongoDB utilizando cursors iterativos (`mongo.Cursor`), formatando as linhas do CSV diretamente no buffer de saída sem carregar o dataset completo na memória RAM.
3. **Expiração Automática (TTL)**: Arquivos gerados expiram em 24 horas, sendo purgados automaticamente do storage para controle de custos de armazenamento ([Armazenamento e Mídia](../architecture/storage-and-media.md)).

---

## 🔗 Referências Cruzadas
- [Catálogo Canônico](../index.md)
- [Armazenamento e Gestão de Mídia](../architecture/storage-and-media.md)
- [Subdomínio de Clientes (Client)](client.md)
- [Subdomínio de Inquilinos (Tenant)](tenant.md)
