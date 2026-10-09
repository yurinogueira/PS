---
type: domain
title: "Subdomínio: Clientes, Sessões Fotográficas e Faturamento (Client)"
description: "Gestão de clientes atendidos por temporada, registros de fotos vinculadas, histórico de faturamento e métodos de pagamento."
tags:
  - domain
  - client
  - dogs
  - photos
  - payments
  - seasons
resource: backend/internal/domain/client
timestamp: 2026-10-02
---

# 📸 Subdomínio: Clientes, Sessões Fotográficas e Faturamento (Client)

O subdomínio de **Client** é o núcleo transacional do **PS (Photo Storage)**, mapeando os clientes atendidos em cada evento/temporada, os competidores/cães vinculados e os registros de compras de fotos.

Para navegação geral, retorne ao [Catálogo Canônico](../index.md).

---

## 🧩 Agregados e Entidades (`SeasonClient`, `Dog`, `Photo`)

Estruturado em `backend/internal/domain/client/client.go`:

```go
type SeasonClient struct {
    ID        string    `json:"id" bson:"_id,omitempty"`
    TenantID  string    `json:"tenant_id" bson:"tenant_id"`
    PersonID  string    `json:"person_id" bson:"person_id"`
    SeasonID  string    `json:"season_id" bson:"season_id"`
    Dogs      []Dog     `json:"dogs" bson:"dogs"`
    CreatedAt time.Time `json:"created_at" bson:"created_at"`
    UpdatedAt time.Time `json:"updated_at" bson:"updated_at"`
}

type Dog struct {
    Breed           string   `json:"breed" bson:"breed"`
    Judge           string   `json:"judge" bson:"judge"`
    Judges          []string `json:"judges" bson:"judges"`
    IsOwner         *bool    `json:"is_owner" bson:"is_owner"`
    CompetitionsWon int      `json:"competitions_won" bson:"competitions_won"`
    WonCompetitions []string `json:"won_competitions" bson:"won_competitions"`
    Photos          []Photo  `json:"photos" bson:"photos"`
}

type Photo struct {
    FileNumber     string     `json:"file_number" bson:"file_number"`
    PhotographerID string     `json:"photographer_id" bson:"photographer_id"`
    PaymentMethod  string     `json:"payment_method" bson:"payment_method"`
    Currency       string     `json:"currency,omitempty" bson:"currency,omitempty"`
    AmountPaid     *float64   `json:"amount_paid" bson:"amount_paid"`
    Judges         []string   `json:"judges,omitempty" bson:"judges,omitempty"`
    Competitions   []string   `json:"competitions,omitempty" bson:"competitions,omitempty"`
    CreatedAt      *time.Time `json:"created_at,omitempty" bson:"created_at,omitempty"`
}
```

---

## 📋 Regras de Negócio e Dinâmica de Dados

### 1. Vínculo por Temporada (`SeasonClient`)
- Cada cliente é associado a uma pessoa física (`PersonID`) e a uma temporada de eventos (`SeasonID`).
- O identificador `tenant_id` é obrigatório em todas as instâncias, garantindo isolamento total entre estúdios.

### 2. Gestão de Cães e Competições (`Dog`)
- Um cliente pode registrar múltiplos cães participantes.
- Cada cão mantém sua raça (`Breed`), histórico de competições ganhas (`CompetitionsWon`, `WonCompetitions`) e juízes que avaliaram as pistas (`Judges`).
- Cães e fotos podem ser adicionados via fluxo detalhado de clientes (`ClientDetailsModal`) ou pelo diálogo rápido direto do Dashboard (`AddDogModal`).

### 3. Registro e Faturamento de Fotos (`Photo`)
- Cada foto contém o número do arquivo original (`FileNumber`) e a vinculação com o fotógrafo que realizou o disparo (`PhotographerID`).
- **Competições por Foto**: Cada foto pode ser associada a uma ou mais competições (`Competitions`), permitindo ao operador selecionar competições já ganhas pelo cão ou cadastrar novas livremente (*freeSolo*). O backend higieniza espaços e remove duplicatas. Nos relatórios, as competições da foto têm prioridade, utilizando as do cão como fallback retroativo.
- **Métodos de Pagamento Suportados**: `Pix`, `Cartão de Crédito`, `Cartão de Débito`, `Dinheiro`, `Outro` ou `Não pago`.
- **Valores e Moedas Suportadas**: Suporta moedas `BRL` (Real brasileiro), `USD` (Dólar americano) e `OTHER` (Outra moeda estrangeira/genérica) através do campo `Currency`, com valor monetário explícito (`AmountPaid`). Os dashboards e extratos agregam e exibem a arrecadação total separada por cada moeda.

---

## 🔗 Referências Cruzadas
- [Catálogo Canônico](../index.md)
- [Multi-tenancy e Isolamento de Dados](../architecture/multitenancy-and-data.md)
- [Subdomínio de Pessoas (Person)](person.md)
- [Subdomínio de Temporadas (Season)](season.md)
- [Subdomínio de Fotógrafos (Photographer)](photographer.md)
- [Subdomínio de Relatórios Assíncronos](report.md)
