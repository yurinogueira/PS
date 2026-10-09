---
type: index
title: "Catálogo Canônico & Mapa Conceitual — PS"
description: "Ponto de entrada central do knowledge bundle do PS (Photo Storage) no padrão Open Knowledge Format (OKF)."
tags:
  - index
  - okf
  - architecture
  - documentation
timestamp: 2026-10-02
---

# 📚 Catálogo Canônico & LLM Wiki — PS (Photo Storage)

Bem-vindo à base de conhecimento canônica do **PS (Photo Storage)**. Este repositório de conhecimento é estruturado sob o padrão **Open Knowledge Format (OKF)** do Google Cloud, servindo como a **Fonte Canônica da Verdade** tanto para desenvolvedores quanto para agentes autônomos de IA.

---

## 🧭 Princípio da Divulgação Progressiva (*Progressive Disclosure*)

Para garantir máxima eficiência no consumo de tokens e prevenir alucinações de modelos de IA, a base de conhecimento adota uma estrutura em árvore:

1. **Nível 1 (Este Catálogo)**: Fornece o panorama geral do ecossistema, taxonomia e sitemap do projeto.
2. **Nível 2 (Índices Temáticos)**: Documentos de visão geral de arquitetura, subdomínios, frontend e operações.
3. **Nível 3 (Especificações Especializadas)**: Especificações aprofundadas com regras de negócio, interfaces e contratos de código.
4. **Nível 4 (ADRs e Runbooks)**: Registros imutáveis de decisão e guias de resolução operacional de incidentes.

> [!TIP]
> **Para Agentes de IA**: Consulte primeiro este catálogo para localizar o arquivo específico necessário à sua tarefa. Leia apenas o documento relevante utilizando `view_file` para manter o contexto enxuto e preciso.

---

## 🗺️ Mapa Conceitual do Ecossistema PS

```mermaid
flowchart TD
    subgraph Core["Plataforma PS"]
        API["Backend REST (Go 1.26)<br>Clean Architecture + DDD"]
        SPA["Frontend SPA (React 19)<br>Vite + MUI v6 + Zustand"]
        DB[(MongoDB 9 / Atlas<br>Multi-tenant Isolado)]
        S3["Storage de Mídia<br>Local / OCI Object Storage"]
    end

    subgraph OKF["Knowledge Bundle (docs/)"]
        ARCH["Arquitetura Global"]
        DOM["Subdomínios DDD"]
        FE["Padrões de Frontend"]
        OPS["Operações & Infraestrutura"]
        ADR["Decisões Arquiteturais (ADRs)"]
        LOG["Trilha de Auditoria (log.md)"]
    end

    API --> DB
    API --> S3
    SPA --> API
    OKF -.->|Documenta Regras & Contratos| Core
```

---

## 🗂️ Índice Estruturado da Base de Conhecimento

### 1. 🏗️ Arquitetura Global (`architecture/`)
Decisões de engenharia em alto nível, isolamento de camadas e requisitos não-funcionais:
- [Visão Geral da Arquitetura](architecture/overview.md): Clean Architecture e DDD em Go, desacoplamento em camadas e modelo SPA.
- [Autenticação e Segurança em Camadas](architecture/auth-and-security.md): Cookies `HttpOnly`, tokens JWT, rate limiting e mitigação OWASP.
- [Multi-tenancy e Isolamento de Dados](architecture/multitenancy-and-data.md): Estratégia de segregação lógica por `tenant_id` e índices compostos no MongoDB.
- [Armazenamento e Gestão de Mídia](architecture/storage-and-media.md): Abstração de storage, sanitização contra Path Traversal e OCI Object Storage.

### 2. 🏛️ Subdomínios de Negócio DDD (`domain/`)
Especificações detalhadas de regras de negócio, agregações e fluxos de cada subdomínio:
- [Tenant (Inquilinos)](domain/tenant.md): Modelagem de tenants, planos, cotas operacionais e ciclo de vida.
- [Auth & Identity (Autenticação)](domain/auth.md): Credenciais, papéis de usuário (RBAC), tokens de sessão e verificação de e-mail.
- [Client (Clientes & Faturamento)](domain/client.md): Gestão de clientes atendidos, dados de faturamento e métodos de pagamento.
- [Photographer (Fotógrafos)](domain/photographer.md): Gestão da equipe fotográfica, credenciamento e vinculação de ensaios.
- [Season (Temporadas & Competições)](domain/season.md): Agrupamento temporal e temático de eventos esportivos e galerias.
- [Person (Pessoas & Participantes)](domain/person.md): Identificação de pessoas, catalogação facial e vínculos com fotos.
- [Report (Relatórios Assíncronos)](domain/report.md): Geração sob demanda de CSV, processamento com baixo consumo de memória e TTL.
- [Audit Log (Trilha de Auditoria)](domain/auditlog.md): Rastreamento imutável de ações operacionais e administrativas.

### 3. 🖥️ Engenharia de Frontend (`frontend/`)
Padrões de desenvolvimento para a SPA React 19:
- [Gerenciamento de Estado com Zustand](frontend/state-management.md): Stores centralizadas, sincronização reativa e proteção contra vazamento de tokens.
- [Roteamento e Controle de Acesso (RBAC)](frontend/routing-and-rbac.md): React Router v7, proteção declarativa com `ProtectedRoute` e menus dinâmicos.
- [Componentes UI e Design System](frontend/ui-components.md): Material UI v6, tema análogo customizado, responsividade e acessibilidade (a11y).

### 4. ⚙️ Operações, Infraestrutura & Runbooks (`operations/`)
Manuais operacionais, infraestrutura como código e automação de entrega contínua:
- [Ambiente e Configuração](operations/environment-and-config.md): Gerenciamento de variáveis de ambiente, `.env.example` e rotação de segredos.
- [Docker e Ambiente de Desenvolvimento Local](operations/docker-and-local-dev.md): Stack Docker Compose e comandos rápidos em `scripts/dev.sh`.
- [Deploy e Topologia de Nuvem](operations/deploy-and-infrastructure.md): Oracle Cloud Infrastructure (OCI Compute), Caddy com SSL automático e Cloudflare.
- [Pipelines de CI/CD](operations/ci-cd-pipelines.md): GitHub Actions, esteiras de testes automatizados, linters e governança de releases.
- **Runbooks de Resolução de Incidentes**:
  - [Runbook: Recuperação de Desastres (Disaster Recovery)](operations/runbooks/disaster-recovery.md): Restabelecimento de nó OCI e failover de DNS.
  - [Runbook: Backup e Restauração de Banco de Dados](operations/runbooks/database-backup.md): Procedimentos de dump/restore no MongoDB Atlas e local.
  - [Runbook: Release e Rollback em Produção](operations/runbooks/release-and-rollback.md): Procedimentos de implantação contínua e reversão imediata.

### 5. 📜 Registros de Decisões de Arquitetura (`adrs/`)
Histórico imutável de decisões de engenharia:
- [ADR 0001: Adoção de Clean Architecture e DDD em Go](adrs/0001-clean-architecture-go.md)
- [ADR 0002: Autenticação via Cookies HttpOnly e Sessões Desacopladas](adrs/0002-httponly-cookie-sessions.md)
- [ADR 0003: Gerenciamento de Estado Descentralizado com Zustand](adrs/0003-zustand-state-management.md)
- [ADR 0004: Sistema de Documentação Canônica Baseado em OKF](adrs/0004-canonical-docs-okf.md)

### 6. 📜 Trilha de Auditoria & Histórico de Modificações
- [Log de Modificações da Base de Conhecimento](log.md): Registro cronológico de evoluções conceituais e estruturais.

---

## 🔍 Como Validar a Integridade da Documentação

A conformidade de toda a árvore de conhecimento é verificada deterministicamente:

```bash
# Validação direta do Knowledge Bundle OKF:
./scripts/check-docs.sh

# Validação através do orquestrador de checagens:
./scripts/check.sh docs

# Validação completa de todo o projeto (Go + React + Terraform + Docs):
./scripts/check.sh all
```
