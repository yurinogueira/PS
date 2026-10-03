---
type: domain
title: "Subdomínio: Trilha de Auditoria e Conformidade (AuditLog)"
description: "Registro cronológico e imutável de alterações em entidades, mudanças de permissões e segurança no PS."
tags:
  - domain
  - auditlog
  - compliance
  - security
  - history
resource: backend/internal/domain/auditlog
timestamp: 2026-10-02
---

# 🛡️ Subdomínio: Trilha de Auditoria e Conformidade (AuditLog)

O subdomínio de **AuditLog** registra de forma imutável e estruturada todas as operações críticas e mutações de dados executadas no ecossistema do **PS (Photo Storage)**.

Para navegação geral, retorne ao [Catálogo Canônico](../index.md).

---

## 🧩 Modelo de Domínio (`AuditLog`, `Action`, `EntityType`)

Estruturado em `backend/internal/domain/auditlog/audit_log.go`:

```go
type Action string

const (
    ActionCreate       Action = "CREATE"
    ActionUpdate       Action = "UPDATE"
    ActionDelete       Action = "DELETE"
    ActionRoleChange   Action = "ROLE_CHANGE"
    ActionAssignTenant Action = "ASSIGN_TENANT"
)

type EntityType string

const (
    EntityUser         EntityType = "user"
    EntityTenant       EntityType = "tenant"
    EntitySeason       EntityType = "season"
    EntityPhotographer EntityType = "photographer"
    EntityPerson       EntityType = "person"
    EntityClient       EntityType = "client"
)

type Change struct {
    FieldChanged string `json:"fieldChanged" bson:"field_changed"`
    OldValue     any    `json:"oldValue" bson:"old_value"`
    NewValue     any    `json:"newValue" bson:"new_value"`
}
```

---

## 📋 Regras de Negócio e Governança

1. **Imutabilidade**: Registros de auditoria são do tipo *append-only*. Nenhuma operação de atualização (`UPDATE`) ou deleção (`DELETE`) é permitida sobre a coleção de logs de auditoria no MongoDB.
2. **Rastreamento de Modificações (`Change`)**: Ao atualizar entidades críticas (como troca de papéis RBAC em usuários ou alteração de planos de tenant), o log detalha o campo alterado, o valor anterior e o novo valor atribuído.
3. **Contextualização do Autor**: Todo registro armazena o `UserID` do autor da requisição, seu papel no momento da ação, o endereço IP de origem e o `TenantID`.

---

## 🔗 Referências Cruzadas
- [Catálogo Canônico](../index.md)
- [Autenticação e Segurança em Camadas](../architecture/auth-and-security.md)
- [Subdomínio de Inquilinos (Tenant)](tenant.md)
- [Subdomínio de Autenticação e Usuários](auth.md)
