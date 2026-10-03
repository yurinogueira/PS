---
type: architecture
title: "Multi-tenancy e Isolamento de Dados — PS"
description: "Estratégia de segregação lógica de tenants no MongoDB, integridade referencial e índices compostos."
tags:
  - architecture
  - multitenancy
  - mongodb
  - database
  - tenant-isolation
timestamp: 2026-10-02
---

# 🏢 Multi-tenancy e Isolamento de Dados — PS

O **PS (Photo Storage)** atua como uma solução SaaS compartilhada que atende múltiplos estúdios de fotografia, federações e organizadores de eventos através de um modelo de **Multi-tenancy Lógico com Banco Compartilhado**.

Este documento detalha as convenções de banco de dados, chaves de particionamento e mecanismos de integridade que garantem isolamento absoluto entre clientes.

Para navegação geral, retorne ao [Catálogo Canônico](../index.md).

---

## 🛡️ 1. Princípios de Isolamento por `tenant_id`

Toda coleção de dados do MongoDB — exceto as coleções globais de sistema (`tenants` e credenciais de `superadmin`) — deve conter o campo discriminador `tenant_id` tipado como `string` (UUID v4 ou identificador semântico).

```mermaid
flowchart TD
    subgraph MongoDB["Banco de Dados MongoDB (Shared Cluster)"]
        subgraph Tenants_Coll["Coleção 'tenants' (Global)"]
            T1["Tenant A: Estúdio Alfa"]
            T2["Tenant B: Federação Beta"]
        end

        subgraph Clients_Coll["Coleção 'clients' (Segregada)"]
            C1["Cliente X (tenant_id: Alfa)"]
            C2["Cliente Y (tenant_id: Beta)"]
        end

        subgraph Photos_Coll["Coleção 'photos' / 'seasons'"]
            P1["Fotos Evento (tenant_id: Alfa)"]
            P2["Fotos Evento (tenant_id: Beta)"]
        end
    end

    AUTH["Contexto de Autenticação (JWT)"] -->|Injeta tenant_id no Request| REPO["MongoDB Repositories"]
    REPO -->|Filtro Obrigatório: bson.M{'tenant_id': tid}| MongoDB
```

### Regras Mandatórias de Repositório:
1. **Filtro Incondicional**: Métodos de busca (`Find`, `FindOne`, `Update`, `Delete`) devem invariavelmente incluir `tenant_id` no filtro BSON:
   ```go
   filter := bson.M{
       "id": id,
       "tenant_id": tenantID,
   }
   ```
2. **Prevenção de Modificação de Tenant**: Operações de atualização (`UpdateOne`, `UpdateMany`) nunca devem aceitar alteração do campo `tenant_id`.
3. **Escopo nos Use Cases**: Use cases recebem o `tenantID` diretamente do token de autenticação via contexto HTTP (`authctx.GetTenantID(ctx)`). O payload da requisição nunca pode ditar ou forjar o `tenant_id`.

---

## 📑 2. Estratégia de Índices Compostos

Para assegurar alta performance em leituras, consultas e pesquisas com baixa cardinalidade, o MongoDB emprega índices compostos com prefixo `tenant_id`:

| Coleção | Índice Composto | Propósito |
| :--- | :--- | :--- |
| `clients` | `{"tenant_id": 1, "id": 1}` | Busca unívoca por ID de cliente no tenant |
| `clients` | `{"tenant_id": 1, "season_id": 1}` | Listagem de clientes vinculados à temporada |
| `seasons` | `{"tenant_id": 1, "is_active": 1}` | Obtenção rápida da temporada ativa do tenant |
| `photographers` | `{"tenant_id": 1, "email": 1}` | Unicidade de fotógrafo por tenant |
| `reports` | `{"tenant_id": 1, "created_at": -1}` | Listagem cronológica do histórico de relatórios |
| `audit_logs` | `{"tenant_id": 1, "timestamp": -1}` | Consulta de trilha de auditoria do tenant |

---

## 🔄 3. Ciclo de Vida do Tenant e Limites Operacionais

Cada tenant opera sob um plano específico que rege suas cotas de armazenamento e funcionalidades ativas (conforme documentado no [Subdomínio de Tenants](../domain/tenant.md)):

- **Planos Disponíveis**: `trial` (período de testes), `basic` (fotógrafo individual), `pro` (estúdio médio), `enterprise` (grandes federações e eventos massivos).
- **Validação de Limites**: O use case de criação de recursos verifica o número atual de registros ativos contra a cota do plano antes de permitir novas inserções.
- **Bloqueio por Inadimplência**: Tenants suspensos ou inadimplentes têm requisições mutativas bloqueadas via middleware, mantendo apenas acesso em modo somente-leitura aos relatórios pré-existentes.

---

## 🔗 Referências Cruzadas
- [Visão Geral da Arquitetura](overview.md)
- [Autenticação e Segurança](auth-and-security.md)
- [Armazenamento e Mídia](storage-and-media.md)
- [Subdomínio de Tenant](../domain/tenant.md)
- [Subdomínio de Auditoria](../domain/auditlog.md)
