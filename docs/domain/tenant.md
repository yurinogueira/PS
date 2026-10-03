---
type: domain
title: "Subdomínio: Inquilinos (Tenant) e Gestão de Planos"
description: "Modelagem do tenant no PS, regras de isolamento, planos de assinatura, limites operacionais e ciclo de vida."
tags:
  - domain
  - tenant
  - ddd
  - plans
  - limits
resource: backend/internal/domain/tenant
timestamp: 2026-10-02
---

# 🏢 Subdomínio: Inquilinos (Tenant) e Gestão de Planos

O subdomínio de **Tenant** encapsula as regras de negócio para a gestão de organizações, estúdios fotográficos e federações clientes que utilizam o **PS (Photo Storage)**.

Para navegação geral, retorne ao [Catálogo Canônico](../index.md).

---

## 🧩 Modelo de Domínio (`Tenant`)

O agregado principal é estruturado em `backend/internal/domain/tenant/tenant.go`:

```go
type Tenant struct {
    Name          string         `json:"name" bson:"_id"`
    Plan          string         `json:"plan" bson:"plan"`
    PaymentStatus string         `json:"paymentStatus" bson:"paymentStatus"`
    Settings      TenantSettings `json:"settings" bson:"settings"`
    PlanStartedAt *time.Time     `json:"planStartedAt,omitempty" bson:"planStartedAt,omitempty"`
    PlanExpiresAt *time.Time     `json:"planExpiresAt,omitempty" bson:"planExpiresAt,omitempty"`
}

type TenantSettings struct {
    HideOverviewByDefault bool `json:"hideOverviewByDefault" bson:"hideOverviewByDefault"`
}
```

---

## 📋 Regras de Negócio e Invariantes

### 1. Planos e Cotas de Assinatura
- **`free` (Período de Testes / Trial)**:
  - Duração de 14 dias (`TrialDurationDays = 14`).
  - Após a expiração do trial sem conversão, a edição de clientes e exportação de relatórios são bloqueadas (`ErrTrialExpired`).
- **`standard` (Plano Padrão)**:
  - Cota máxima de 300 clientes cadastrados (`StandardMaxClients = 300`).
  - Se a organização ultrapassar o limite contratado, a criação de novos eventos e geração de relatórios são suspensas (`ErrLimitExceeded`).

### 2. Status Financeiro (`PaymentStatus`)
- **`paid`**: Assinatura regular e acesso total às funcionalidades contratadas.
- **`unpaid`**: Inadimplência ou falha no processamento da assinatura. O acesso a operações mutativas e exportações é suspenso imediatamente (`ErrPaymentUnpaid`), preservando a visualização de dados históricos.

### 3. Configurações Específicas do Tenant (`TenantSettings`)
- **`HideOverviewByDefault`**: Permite aos administradores ocultar o bloco de métricas financeiras globais (visão geral da receita) na tela inicial do dashboard por padrão, conferindo privacidade em ambientes operacionais compartilhados com fotógrafos.

---

## 🔗 Referências Cruzadas
- [Catálogo Canônico](../index.md)
- [Multi-tenancy e Isolamento de Dados](../architecture/multitenancy-and-data.md)
- [Subdomínio de Clientes](client.md)
- [Subdomínio de Usuários e Autenticação](auth.md)
- [Subdomínio de Trilha de Auditoria](auditlog.md)
