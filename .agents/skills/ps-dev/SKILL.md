---
name: ps-dev
description: >-
  Guia e comandos otimizados para editar, validar e executar o projeto PS
  (Go backend, React frontend e Docker Compose), minimizando o consumo de tokens
  e garantindo a atualização mandatória da documentação canônica (OKF), do log diário (docs/logs/) e docs/log.md em cada entrega.
---

# Skill: Desenvolvimento e Execução do PS

Esta skill define as diretrizes de arquitetura, fluxos de edição, documentação OpenAPI/Swagger e o conjunto de ferramentas otimizadas para interagir com o projeto **PS (Photo Storage)**, garantindo velocidade máxima e economia drástica de tokens na janela de contexto.

---

## ⚡ Regra de Ouro: Economia de Tokens & Documentação Canônica

> [!IMPORTANT]
> **1. Consulta Prévia Obrigatória**: Antes de iniciar qualquer alteração ou pesquisa em código, consulte o catálogo canônico em `docs/index.md` (seguindo as diretrizes da skill `ps-docs`). A divulgação progressiva (*progressive disclosure*) evita a leitura de arquivos desnecessários e economiza até 90% dos tokens de contexto.
> **2. Documentação e Log Obrigatórios em Toda Tarefa**: Qualquer alteração (nova feature, correção de bug, atualização de versões/dependências ou refatoração) exige a atualização da respectiva documentação canônica em `docs/` e o registro datado no arquivo diário correspondente sob `docs/logs/AAAA-MM-DD.md` (indexado em `docs/log.md`) antes de finalizar o trabalho.
> **3. Evite Comandos Verbosos**: **Nunca** execute comandos brutos como `go test ./...` ou `npm run lint` diretamente, pois eles poluem o contexto com dezenas de linhas irrelevantes (`? [no test files]`, logs de build, etc.).
> **Sempre utilize os scripts auxiliares compactos em `scripts/`**:
> - `./scripts/check.sh all` ou `./scripts/check.sh backend|frontend|docs`
> - `./scripts/fix.sh`
> - `./scripts/swagger.sh` (obrigatório ao alterar rotas/handlers do backend)
> - `./scripts/dev.sh start|stop|status|logs`

### Comparativo de Comandos

| Tarefa | Comando Verboso (Evitar) | Comando Compacto (Usar) | Redução de Tokens |
| :--- | :--- | :--- | :--- |
| **Checagem Geral** | `go vet + go test + tsc + eslint + prettier + vitest` | `./scripts/check.sh all` | **~85% menos tokens** |
| **Checar Docs OKF**| `find docs -name '*.md' + check links` | `./scripts/check.sh docs` | Retorna 1 linha em sucesso |
| **Checar Backend** | `cd backend && go vet ./... && go test ./...` | `./scripts/check.sh backend` | Retorna 1 linha em sucesso |
| **Checar Frontend** | `cd frontend && npx tsc -b && npm run lint && ...` | `./scripts/check.sh frontend` | Retorna 1 linha em sucesso |
| **Auto-Formatar** | `go fmt + prettier --write + eslint --fix` | `./scripts/fix.sh` | Retorno limpo e direto |
| **Regenerar Swagger**| `cd backend && swag init ...` | `./scripts/swagger.sh` | Retorno direto e limpo |
| **Subir Stack** | `docker compose up -d` | `./scripts/dev.sh start` | Formata tabela limpa |
| **Status Containers** | `docker compose ps` | `./scripts/dev.sh status` | Resumo de portas e status |

---

## 🏗️ Visão Geral da Arquitetura

### 1. Backend (`backend/`)
- **Linguagem**: Go 1.26.
- **Padrão**: Clean Architecture + DDD.
- **Estrutura de Pastas**:
  - `internal/domain/`: Entidades puras, regras de negócio, permissões/roles. Todos os structs de domínio expostos na API devem conter tags `json:"camelCase"`.
  - `internal/application/ports/`: Interfaces/contratos de repositórios, serviços de autenticação (`TokenService`, `PasswordHasher`), storage.
  - `internal/application/usecase/`: Casos de uso (orquestração da lógica de negócio).
  - `internal/infrastructure/`: Implementações concretas (MongoDB, JWT, bcrypt, Local Storage com sanitização de path).
  - `internal/interfaces/rest/`:
    - `handlers/`: Handlers HTTP que recebem DTOs, extraem a identidade via cookies `HttpOnly` (`ps_access_token`) ou Bearer token (sempre retornando `""` em caso de erro, forçando 401) e possuem anotações declarativas do Swagger.
    - `router.go`: Registro de rotas HTTP, montagem da cadeia de middlewares de segurança (`SecurityHeaders`, `CORS` com whitelist, `RateLimiter`, `BodyLimit`) e rota condicional `GET /swagger/` (apenas em `LOG_LEVEL=debug`).
  - `internal/shared/`: Middlewares (CORS, RateLimit, BodyLimit, SecurityHeaders, RequestID, Logging) e envelope HTTP padronizado (`httpx.Success`, `httpx.Created`, `httpx.Error`).
  - `docs/`: Documentação gerada automaticamente pelo Swaggo (`docs.go`, `swagger.json`, `swagger.yaml`).
  - `cmd/api/main.go`: Ponto de entrada do servidor HTTP com timeouts defensivos e anotações gerais da API Swagger.

### 2. Frontend (`frontend/`)
- **Stack**: React 19, TypeScript, Vite, Material UI (MUI v6), `@mui/icons-material`, Zustand, React Router v7, Axios, Vitest.
- **Estrutura de Pastas**:
  - `src/features/auth/`: Módulo de autenticação com layout Split-Screen (`LoginPage.tsx`, `RegisterPage.tsx`, `AuthHeroBanner.tsx`), store Zustand (`auth.store.ts` gerenciando apenas perfil público, sem tokens), `auth.service.ts` e tipos.
  - `src/features/dashboard/`: Painel geral com KPIs da temporada ativa, métricas em tempo real e atalhos rápidos (`DashboardPage.tsx`).
  - `src/features/people/`: Gestão de pessoas/proprietários com visão Master-Detail de cachorros e fotos (`PeoplePage.tsx`, `PersonDetailsPage.tsx`).
  - `src/features/clients/`: Gestão de clientes vinculados à temporada ativa, competições ganhas e fotos (`ClientsPage.tsx`, `ClientDetailsPage.tsx`, `ClientDetailsModal.tsx`, `LinkClientModal.tsx`).
  - `src/features/reports/`: Extração assíncrona e download seguro de relatórios CSV (`ReportDownloadPage.tsx`, `report.service.ts`).
  - `src/features/seasons/`: Gestão e alternância de temporadas ativas de eventos fotográficos (`SeasonsPage.tsx`).
  - `src/features/photographers/`: Gestão e cadastro de fotógrafos da equipe (`PhotographersPage.tsx`).
  - `src/features/admin/`: Gestão administrativa multi-tenant e usuários (`TenantsPage.tsx`, `UsersPage.tsx`).
  - `src/layouts/`: Shell SaaS persistente (`Sidebar.tsx`, `Topbar.tsx`, `AppLayout.tsx`).
  - `src/routes/`: Definição de rotas públicas (`/login`, `/register`) e privadas via `ProtectedRoute.tsx`.
  - `src/services/api/`: Cliente Axios (`client.ts`) configurado para `/api/v1` com `withCredentials: true` para transporte transparente e seguro de cookies `HttpOnly`.
  - `src/services/storage/`: Wrapper de acesso seguro ao `localStorage` (`storage.ts`) para suporte a testes e SSR (apenas para dados de UI, nunca tokens).
  - `src/styles/`: Configuração de tema Material UI com harmonia análoga (`theme.ts`).

---

## 🛠️ Fluxo de Trabalho e Regras Mandatórias

### 1. Editando o Backend & Regra do Swagger
1. Ao adicionar/modificar entidades, atualize `internal/domain/` garantindo tags `json:"camelCase"`.
2. Defina os contratos em `internal/application/ports/`.
3. Implemente as regras nos use cases (`internal/application/usecase/`) e crie/atualize os testes unitários (`*_test.go`).
4. Implemente os adapters em `internal/infrastructure/` e handlers em `internal/interfaces/rest/handlers/`.
5. > [!IMPORTANT]
   > **Regra Obrigatória do Swagger**: Sempre que adicionar, alterar ou remover uma rota, parâmetro ou handler HTTP, adicione/atualize os comentários `@Summary`, `@Tags`, `@Param`, `@Success`, `@Router`, etc. no handler e **execute imediatamente**:
   > ```bash
   > ./scripts/swagger.sh
   > ```
6. Valide a integridade do backend com:
   ```bash
   ./scripts/check.sh backend
   ```

### 2. Editando o Frontend
1. Crie ou modifique componentes/telas em `src/features/<feature>/`.
2. Utilize ícones semânticos de `@mui/icons-material` e componentes padronizados do Design System.
3. Para acesso ao armazenamento local, use sempre o utilitário seguro `safeStorage` de `src/services/storage/storage.ts`.
4. Gerencie estado global via stores Zustand em `src/features/<feature>/state/`.
5. Valide tipos, lint, formatação e testes unitários com:
   ```bash
   ./scripts/check.sh frontend
   ```
6. Se houver divergências de formatação ou lint simples:
   ```bash
   ./scripts/fix.sh
   ```

### 3. Atualizando a Documentação Canônica (OKF) & Trilha de Auditoria
1. Identifique os documentos canônicos impactados sob `docs/` (`domain/`, `architecture/`, `frontend/`, `operations/`).
2. Atualize o conteúdo técnico refletindo fielmente o código novo ou corrigido.
3. Insira o registro cronológico no topo de `docs/log.md` com a data atual (`AAAA-MM-DD`), escopo, PR/issue e descrição.
4. Valide a documentação:
   ```bash
   ./scripts/check.sh docs
   ```

### 4. Rodando o Projeto com Docker Compose
Para inicializar e gerenciar a stack completa:
- **Iniciar serviços**: `./scripts/dev.sh start`
- **Verificar status**: `./scripts/dev.sh status`
- **Consultar logs**: `./scripts/dev.sh logs [backend|frontend|mongo]`
- **Reiniciar serviço**: `./scripts/dev.sh restart backend`
- **Parar serviços**: `./scripts/dev.sh stop`

Portas e URLs padrão:
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:8080`
- **Documentação Swagger UI**: `http://localhost:8080/swagger/index.html`
- **MongoDB**: `localhost:27017`

---

## 🚨 Resolução Rápida de Erros (Runbook)

- **Falha no `check.sh backend`**:
  - O script isola e exibe apenas o pacote ou teste que falhou.
  - Para rodar um teste específico sem ruído:
    `cd backend && go test -v ./internal/application/usecase/auth`
- **Falha no `check.sh frontend`**:
  - Se for erro de tipos: verifique a interface TypeScript indicada pelo `tsc`.
  - Se for erro de formatação: rode `./scripts/fix.sh`.
- **Containers não sobem ou alterações no Go não refletem**:
  - Execute `docker compose build backend && docker compose up -d backend` para recompilar a imagem da API Go.
  - Execute `./scripts/dev.sh logs` para ver as últimas 30 linhas de log.
