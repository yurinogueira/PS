---
type: log
title: "Log de Modificações e Evoluções — PS"
description: "Registro cronológico de decisões arquiteturais, evoluções de domínio e alterações na base de conhecimento canônica."
tags:
  - log
  - changelog
  - okf
  - audit
timestamp: 2026-10-09
---

# 📜 Log de Modificações da Base de Conhecimento — PS

Este arquivo registra cronologicamente todas as decisões de engenharia, evoluções de domínio e alterações estruturais documentadas no Knowledge Bundle canônico do **PS (Photo Storage)**.

Para acessar o índice completo da base de conhecimento, consulte o [Catálogo Canônico](index.md).

---

## 📅 2026-10-09 — Política de Governança de Documentação Contínua OKF & Trilha Histórica

### 🎯 Resumo da Intervenção
- **Contexto**: Estabelecimento de política universal e mandatória determinando que qualquer tarefa de desenvolvimento (seja criação de features, correção de bugs, atualização de versões/dependências ou refatorações) atualize obrigatoriamente a base canônica em `docs/` e registre a intervenção de forma datada em `docs/log.md`.
- **Governança, Skills e Regras de Agentes**:
  - Atualização de [.agents/rules/docs.md](../.agents/rules/docs.md) instituindo a regra universal de zero divergência documental.
  - Atualização de [.agents/rules/security.md](../.agents/rules/security.md) incluindo seção mandatória de atualização de documentação canônica de segurança.
  - Atualização da skill [.agents/skills/ps-workflow/SKILL.md](../.agents/skills/ps-workflow/SKILL.md) com etapa mandatória no ciclo de vida e checklist estrito no Pull Request.
  - Atualização da skill [.agents/skills/ps-docs/SKILL.md](../.agents/skills/ps-docs/SKILL.md) definindo a correspondência de documentos por tipo de tarefa e o padrão de escrita do log.
  - Atualização da skill [.agents/skills/ps-dev/SKILL.md](../.agents/skills/ps-dev/SKILL.md) com atualização de versão Go 1.26 e inclusão de docs no checklist de dev.
  - Atualização da skill [.agents/skills/ps-security/SKILL.md](../.agents/skills/ps-security/SKILL.md) com checklist obrigatório de documentação canônica e validação via scripts.
  - Atualização da skill [.agents/skills/ps-issues/SKILL.md](../.agents/skills/ps-issues/SKILL.md) exigindo critérios de documentação nas User Stories, relatos de bugs e tarefas de manutenção/dependências (`chore`/`deps`).
  - Adendo formal registrado no [ADR 0004](adrs/0004-canonical-docs-okf.md).
- **Automação e Gates de Qualidade**:
  - `scripts/check-docs.sh`: Implementada validação de estrutura/datas de `docs/log.md` e verificação ativa de Zero-Divergence (`--verify-sync`) detectando alterações de código/infra sem docs correspondentes.
  - `scripts/check.sh`: Integração do `--verify-sync` no comando padrão `./scripts/check.sh docs` e `./scripts/check.sh all`.
  - `.github/workflows/docs.yml`: Disparo em todos os PRs direcionados à `main` com validação de Zero-Divergence obrigatória (salvo automação do dependabot).
- **Documentos Canônicos Atualizados**:
  - [docs/adrs/0004-canonical-docs-okf.md](adrs/0004-canonical-docs-okf.md)
  - [docs/index.md](index.md)
  - [docs/log.md](log.md)
  - [docs/operations/ci-cd-pipelines.md](operations/ci-cd-pipelines.md)

---

## 📅 2026-10-09 — Priorização de Eventos na Navegação Lateral e Redirecionamento (PR #130, Issue #109)

### 🎯 Resumo da Alteração
- **Contexto**: Reestruturação da experiência de navegação lateral na SPA, colocando a gestão de eventos/temporadas como ponto de entrada inicial do fluxo de trabalho do operador.
- **Modificações por Camada**:
  - **Frontend / UI**: Reordenação de `menuItems` em `Sidebar.tsx`, definindo "Eventos" (`/seasons`) na primeira posição, antes de "Visão Geral" (`/dashboard`). Na tela `SeasonsPage.tsx`, o clique em uma linha da tabela ou no botão explícito "Definir como Ativo" define a temporada ativa no `seasonStore` e redireciona automaticamente para `/dashboard`.
- **Documentos Canônicos Atualizados**:
  - [docs/frontend/routing-and-rbac.md](frontend/routing-and-rbac.md)

---

## 📅 2026-10-09 — Atualização da Dependência source-map-js para 1.2.2 (PR #129)

### 🎯 Resumo da Alteração
- **Contexto**: Atualização de segurança e manutenção de dependência indireta no módulo frontend via Dependabot.
- **Modificações por Camada**:
  - **Frontend / Dependências**: Atualização do pacote `source-map-js` de `1.2.1` para `1.2.2` no `frontend/package-lock.json`.
- **Documentos Canônicos Atualizados**:
  - [docs/log.md](log.md)

---

## 📅 2026-10-09 — Vinculação de Fotos a Múltiplas Competições (PR #128, Issue #111)

### 🎯 Resumo da Alteração
- **Contexto**: Suporte à associação de cada foto cadastrada a uma ou mais competições no ecossistema PS, permitindo selecionar das competições ganhas pelo cão ou cadastrar novas livremente (*freeSolo*).
- **Modificações por Camada**:
  - **Backend / Domínio & Persistência**: Adicionado campo `Competitions []string` na struct `Photo` (`client.go`), suporte a consultas em `dogs.photos.competitions` no MongoDB, normalização e sanitização contra duplicatas no use case de clientes (`client/service.go`) e exportação de relatórios analíticos priorizando competições da foto com fallback para as do cão (`report/service.go`). Atualização dos arquivos OpenAPI/Swagger.
  - **Frontend / UI**: Campo `competitions?: string[]` na tipagem da interface `Photo` (`client.service.ts`), inclusão de autocomplete múltiplo com `freeSolo` em `ClientDetailsModal`, `LinkClientModal`, `AddDogModal`, `ClientDetailsPage`, `ClientsPage` e chips visuais com ícone de troféu em `PersonDetailsPage`.
- **Documentos Canônicos Atualizados**:
  - [docs/domain/client.md](domain/client.md)
  - [docs/domain/report.md](domain/report.md)
  - [docs/frontend/ui-components.md](frontend/ui-components.md)

---

## 📅 2026-10-09 — Mitigação de Dessincronização de Role em Sessão Ativa e Auto-Escalonamento (PR #127, Issue #118)

### 🎯 Resumo da Alteração
- **Contexto**: Mitigação de vulnerabilidade de autorização onde privilégios revogados persistiam na sessão JWT ativa até a expiração do token, além de prevenção contra auto-alteração de perfil por administradores e bump do Go nos pipelines.
- **Modificações por Camada**:
  - **Backend / Segurança & CI**: O middleware de autenticação (`AuthMiddleware`) passa a revalidar o usuário contra o repositório (`userRepo.FindByID`), garantindo a propagação da role real e rejeitando contas inativas (`401 Unauthorized`). No `admin_handler` e usecase, implementada trava contra auto-demissão e auto-escalonamento de administradores. O pipeline `.github/workflows/backend.yml` foi atualizado para Go 1.26.
  - **Frontend / UI**: Desabilitação do botão de alteração de role para o próprio usuário na tela `AdminUsersPage` com tooltip explicativo.
- **Documentos Canônicos Atualizados**:
  - [docs/architecture/auth-and-security.md](architecture/auth-and-security.md)
  - [docs/operations/ci-cd-pipelines.md](operations/ci-cd-pipelines.md)

---

## 📅 2026-10-09 — Moeda Estrangeira Genérica (OTHER) e Segregação na Arrecadação (PR #126, Issue #108)

### 🎯 Resumo da Alteração
- **Contexto**: Inclusão de suporte à moeda genérica internacional "Outro (`OTHER`)" para operações comerciais com moedas não mapeadas explicitamente, exibindo os totais segregados na arrecadação geral.
- **Modificações por Camada**:
  - **Backend / Relatórios**: Atualização de `FormatPaidAmount` no use case de relatórios para formatar valores com identificador `Outro` para moeda `OTHER`.
  - **Frontend / UI**: Adição de "Outro" no seletor de moedas (`client.service.ts`), totalização segregada de faturamento por moeda (`R$`, `$`, `Outro`) no painel do `DashboardPage` e nos detalhes de pessoa (`PersonDetailsPage`).
- **Documentos Canônicos Atualizados**:
  - [docs/domain/client.md](domain/client.md)
  - [docs/domain/report.md](domain/report.md)

---

## 📅 2026-10-09 — Botão de Ação Rápida (+ 🐾) e Modal AddDogModal na Visão Geral (PR #125, Issue #107)

### 🎯 Resumo da Alteração
- **Contexto**: Permitir a inclusão rápida de novos cães e fotos diretamente pela tela principal do Dashboard, agilizando o fluxo de atendimento em competições presenciais.
- **Modificações por Camada**:
  - **Frontend / UI**: Criação do componente `AddDogModal.tsx` com formulário completo para dados do cão, seleção de juízes, fotos e formas de pagamento, integrado à `DashboardPage` através de botão compacto de adição (+ 🐾).
- **Documentos Canônicos Atualizados**:
  - [docs/frontend/ui-components.md](frontend/ui-components.md)
  - [docs/frontend/routing-and-rbac.md](frontend/routing-and-rbac.md)

---

## 📅 2026-10-07 — Atualização do MongoDB para Versão 9 no Docker Compose (PR #123)

### 🎯 Resumo da Alteração
- **Contexto**: Atualização do banco de dados no ambiente local de desenvolvimento para a imagem oficial `mongo:9`.
- **Modificações por Camada**:
  - **Infraestrutura / Docker**: Atualização da diretiva de imagem no arquivo `docker-compose.yml`.
- **Documentos Canônicos Atualizados**:
  - [docs/operations/docker-and-local-dev.md](operations/docker-and-local-dev.md)
  - [docs/index.md](index.md)

---

## 📅 2026-10-05 — Atualização de Dependências do Frontend (PR #124)

### 🎯 Resumo da Alteração
- **Contexto**: Atualização de pacotes de desenvolvimento no módulo frontend via Dependabot, incluindo Vite 6.2.0 e ferramentas de linting.
- **Modificações por Camada**:
  - **Frontend / Build**: Atualização de dependências em `frontend/package.json` e `package-lock.json`.
- **Documentos Canônicos Atualizados**:
  - [docs/log.md](log.md)

---

## 📅 2026-10-05 — Atualização de Provedores OCI no Terraform (PR #122)

### 🎯 Resumo da Alteração
- **Contexto**: Atualização do conjunto de provedores Oracle Cloud Infrastructure (OCI) nas rotinas de IaC do Terraform.
- **Modificações por Camada**:
  - **Infraestrutura / Terraform**: Atualização dos locks de providers sob a pasta `terraform/`.
- **Documentos Canônicos Atualizados**:
  - [docs/log.md](log.md)

---

## 📅 2026-10-02 — Implementação do Sistema Canônico OKF (Issue #119)

### 🚀 Bootstrap da Documentação Canônica (Open Knowledge Format)
- **Contexto**: Implementação da [Issue #119](https://github.com/yurinogueira/PS/issues/119) com objetivo de unificar arquitetura, subdomínios DDD, frontend e operações em uma única fonte da verdade.
- **Novos Documentos Criados**:
  - **Catálogo Central**: [docs/index.md](index.md) e [docs/log.md](log.md).
  - **Arquitetura**:
    - [docs/architecture/overview.md](architecture/overview.md)
    - [docs/architecture/auth-and-security.md](architecture/auth-and-security.md)
    - [docs/architecture/multitenancy-and-data.md](architecture/multitenancy-and-data.md)
    - [docs/architecture/storage-and-media.md](architecture/storage-and-media.md)
  - **Subdomínios DDD**:
    - [docs/domain/tenant.md](domain/tenant.md)
    - [docs/domain/auth.md](domain/auth.md)
    - [docs/domain/client.md](domain/client.md)
    - [docs/domain/photographer.md](domain/photographer.md)
    - [docs/domain/season.md](domain/season.md)
    - [docs/domain/person.md](domain/person.md)
    - [docs/domain/report.md](domain/report.md)
    - [docs/domain/auditlog.md](domain/auditlog.md)
  - **Frontend**:
    - [docs/frontend/state-management.md](frontend/state-management.md)
    - [docs/frontend/routing-and-rbac.md](frontend/routing-and-rbac.md)
    - [docs/frontend/ui-components.md](frontend/ui-components.md)
  - **Operações e Runbooks**:
    - [docs/operations/environment-and-config.md](operations/environment-and-config.md)
    - [docs/operations/docker-and-local-dev.md](operations/docker-and-local-dev.md)
    - [docs/operations/deploy-and-infrastructure.md](operations/deploy-and-infrastructure.md)
    - [docs/operations/ci-cd-pipelines.md](operations/ci-cd-pipelines.md)
    - [docs/operations/runbooks/disaster-recovery.md](operations/runbooks/disaster-recovery.md)
    - [docs/operations/runbooks/database-backup.md](operations/runbooks/database-backup.md)
    - [docs/operations/runbooks/release-and-rollback.md](operations/runbooks/release-and-rollback.md)
  - **ADRs**:
    - [docs/adrs/0001-clean-architecture-go.md](adrs/0001-clean-architecture-go.md)
    - [docs/adrs/0002-httponly-cookie-sessions.md](adrs/0002-httponly-cookie-sessions.md)
    - [docs/adrs/0003-zustand-state-management.md](adrs/0003-zustand-state-management.md)
    - [docs/adrs/0004-canonical-docs-okf.md](adrs/0004-canonical-docs-okf.md)
- **Automação e Governança**:
  - Script determinístico de integridade: `scripts/check-docs.sh`.
  - Integração no orquestrador de checagens: `scripts/check.sh` (`check_docs`).
  - Workflow de CI: `.github/workflows/docs.yml`.
  - Nova skill de governança para agentes: `.agents/skills/ps-docs/SKILL.md`.
  - Regra obrigatória de integridade: `.agents/rules/docs.md`.
