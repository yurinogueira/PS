---
type: domain
title: "Subdomínio: Temporadas e Eventos (Season)"
description: "Agrupamento cronológico e temático de eventos esportivos, juízes e fotógrafos escalados."
tags:
  - domain
  - season
  - events
  - competitions
  - judges
resource: backend/internal/domain/season
timestamp: 2026-10-09
---

# 🏆 Subdomínio: Temporadas e Eventos (Season)

O subdomínio de **Season** organiza o escopo temporal e temático das coberturas fotográficas e exposições caninas gerenciadas no **PS (Photo Storage)**.

Para navegação geral, retorne ao [Catálogo Canônico](../index.md).

---

## 🧩 Modelo de Domínio (`Season`)

Estruturado em `backend/internal/domain/season/season.go`:

```go
type Season struct {
    ID              string    `json:"id" bson:"_id,omitempty"`
    TenantID        string    `json:"tenant_id" bson:"tenant_id"`
    Name            string    `json:"name" bson:"name"`
    PhotographerIDs []string  `json:"photographer_ids" bson:"photographer_ids"`
    Judges          []string  `json:"judges" bson:"judges"`
    CreatedAt       time.Time `json:"created_at" bson:"created_at"`
    UpdatedAt       time.Time `json:"updated_at" bson:"updated_at"`
}
```

---

## 📋 Regras de Negócio e Agregações

1. **Escopo Operacional Ativo**: O tenant define a temporada ativa de trabalho. Todos os fluxos rápidos de inserção de clientes e buscas de fotos associam-se por padrão à temporada selecionada na barra superior da aplicação.
2. **Juízes Oficiais (`Judges`)**: A temporada armazena o corpo de árbitros e juízes oficiais credenciados para as pistas do evento, servindo como autocompletar e validação nos cadastros de competições dos cães.
3. **Escalação de Fotógrafos (`PhotographerIDs`)**: Garante que apenas profissionais credenciados na temporada recebam créditos de disparo e associação de fotos vendidas.
4. **Exclusão em Cascata e Preservação de Pessoas**: Ao excluir uma temporada/evento, são removidas em cascata as participações vinculadas de clientes (`SeasonClient`), os registros de cães e fotos associados à temporada. O cadastro base da pessoa física (`Person`) permanece preservado e intacto no tenant.

---

## 🔗 Referências Cruzadas
- [Catálogo Canônico](../index.md)
- [Subdomínio de Clientes (Client)](client.md)
- [Subdomínio de Fotógrafos (Photographer)](photographer.md)
- [Subdomínio de Pessoas (Person)](person.md)
- [Subdomínio de Relatórios Assíncronos](report.md)
