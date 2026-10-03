---
type: domain
title: "Subdomínio: Fotógrafos e Atribuições Operacionais (Photographer)"
description: "Cadastro de fotógrafos da equipe, vínculos com tenants e atribuições de cobertura fotográfica."
tags:
  - domain
  - photographer
  - events
  - assignments
resource: backend/internal/domain/photographer
timestamp: 2026-10-02
---

# 📷 Subdomínio: Fotógrafos e Atribuições Operacionais (Photographer)

O subdomínio de **Photographer** gerencia os profissionais de captura de imagens vinculados a um tenant no **PS (Photo Storage)**.

Para navegação geral, retorne ao [Catálogo Canônico](../index.md).

---

## 🧩 Modelo de Domínio (`Photographer`)

Estruturado em `backend/internal/domain/photographer/photographer.go`:

```go
type Photographer struct {
    ID        string    `json:"id" bson:"_id,omitempty"`
    TenantID  string    `json:"tenant_id" bson:"tenant_id"`
    Name      string    `json:"name" bson:"name"`
    CreatedAt time.Time `json:"created_at" bson:"created_at"`
    UpdatedAt time.Time `json:"updated_at" bson:"updated_at"`
}
```

---

## 📋 Regras de Negócio e Operação

1. **Vínculo com Tenant**: Todo fotógrafo pertence exclusivamente à organização representada por seu `TenantID`.
2. **Escalação em Temporadas**: As temporadas de eventos (`Season`) mantêm a lista de fotógrafos escalados para cobertura (`PhotographerIDs`).
3. **Crédito de Fotos e Comissões**: Ao registrar a venda de fotos no [Subdomínio de Clientes](client.md), cada item armazena o `PhotographerID` do autor, permitindo apuração de produtividade e relatórios de repasse de comissões.

---

## 🔗 Referências Cruzadas
- [Catálogo Canônico](../index.md)
- [Subdomínio de Clientes (Client)](client.md)
- [Subdomínio de Temporadas (Season)](season.md)
- [Subdomínio de Relatórios Assíncronos](report.md)
