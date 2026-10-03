---
type: domain
title: "Subdomínio: Pessoas e Participantes (Person)"
description: "Cadastro de pessoas físicas, proprietários e competidores participantes das temporadas fotográficas."
tags:
  - domain
  - person
  - participants
  - contacts
resource: backend/internal/domain/person
timestamp: 2026-10-02
---

# 👤 Subdomínio: Pessoas e Participantes (Person)

O subdomínio de **Person** centraliza o cadastro de pessoas físicas (proprietários de animais, participantes e contatos comerciais) no **PS (Photo Storage)**.

Para navegação geral, retorne ao [Catálogo Canônico](../index.md).

---

## 🧩 Modelo de Domínio (`Person`)

Estruturado em `backend/internal/domain/person/person.go`:

```go
type Person struct {
    ID               string    `json:"id" bson:"_id,omitempty"`
    TenantID         string    `json:"tenant_id" bson:"tenant_id"`
    Name             string    `json:"name" bson:"name"`
    Email            string    `json:"email" bson:"email"`
    AlternativeEmail string    `json:"alternative_email" bson:"alternative_email"`
    Phone            string    `json:"phone" bson:"phone"`
    CreatedAt        time.Time `json:"created_at" bson:"created_at"`
    UpdatedAt        time.Time `json:"updated_at" bson:"updated_at"`
}
```

---

## 📋 Regras de Negócio e Relacionamentos

1. **Reutilização Trans-Temporadas**: Uma pessoa cadastrada no tenant pode ser vinculada como cliente em múltiplas temporadas (`SeasonClient`) sem duplicação de dados cadastrais.
2. **Canais de Contato**: Mantém telefone e múltiplos endereços de e-mail (`Email`, `AlternativeEmail`) para envio automatizado de links de galerias e faturas digitais.
3. **Isolamento de Contatos**: O e-mail e telefone de uma pessoa são protegidos e confinados ao `TenantID` correspondente, não sendo compartilhados com outras organizações.

---

## 🔗 Referências Cruzadas
- [Catálogo Canônico](../index.md)
- [Subdomínio de Clientes (Client)](client.md)
- [Subdomínio de Temporadas (Season)](season.md)
- [Subdomínio de Relatórios Assíncronos](report.md)
