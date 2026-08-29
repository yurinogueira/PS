# Guia de Contribuição — PS (Photo Storage) 📸

Obrigado pelo seu interesse em contribuir para o **PS (Photo Storage)**! Este documento estabelece as diretrizes, padrões técnicos e o fluxo de trabalho obrigatório para manter a qualidade, segurança e consistência da base de código.

---

## 🧭 Sumário

1. [Código de Conduta](#-código-de-conduta)
2. [Pré-requisitos & Configuração do Ambiente](#-pré-requisitos--configuração-do-ambiente)
3. [Fluxo de Trabalho Git](#-fluxo-de-trabalho-git)
   - [Sincronização Obrigatória com a `main`](#sincronização-obrigatória-com-a-main)
   - [Convenção de Branches](#convenção-de-branches)
   - [Padrão de Commits (Conventional Commits)](#padrão-de-commits-conventional-commits)
4. [Validação Obrigatória & Scripts Utilitários](#-validação-obrigatória--scripts-utilitários)
5. [Diretrizes de Arquitetura & Qualidade](#-diretrizes-de-arquitetura--qualidade)
   - [Backend (Go & Clean Architecture)](#backend-go--clean-architecture)
   - [Frontend (React 19, TypeScript & MUI)](#frontend-react-19-typescript--mui)
6. [Práticas de Segurança & Defesa em Profundidade](#-práticas-de-segurança--defesa-em-profundidade)
7. [Submissão de Pull Requests](#-submissão-de-pull-requests)

---

## 🤝 Código de Conduta

Ao participar deste projeto, você concorda em cumprir o nosso [Código de Conduta](CODE_OF_CONDUCT.md) em todas as interações. Esperamos um ambiente acolhedor, respeitoso e livre de assédio para todos os colaboradores.

---

## 🛠️ Pré-requisitos & Configuração do Ambiente

### Requisitos Mínimos
- [Docker](https://www.docker.com/) e Docker Compose (recomendado para desenvolvimento integrado) **OU**:
  - [Go 1.25+](https://golang.org/)
  - [Node.js 22+](https://nodejs.org/) com `npm`
  - Instância do MongoDB 8+

### Passo a Passo de Setup

1. **Clone o Repositório**:
   ```bash
   git clone https://github.com/yurinogueira/PS.git
   cd PS
   ```

2. **Configure as Variáveis de Ambiente**:
   ```bash
   cp .env.example .env
   ```

3. **Inicie o Ambiente Local**:
   ```bash
   ./scripts/dev.sh start
   ```

   - **Frontend SPA**: `http://localhost:5173`
   - **Backend API**: `http://localhost:8080`
   - **Swagger UI**: `http://localhost:8080/swagger/index.html`

4. **Comandos Úteis de Suporte**:
   ```bash
   ./scripts/dev.sh status  # Verifica o status dos containers
   ./scripts/dev.sh logs    # Acompanha os logs em tempo real
   ./scripts/dev.sh stop    # Encerra os serviços
   ```

---

## 🌿 Fluxo de Trabalho Git

### Sincronização Obrigatória com a `main`

> [!IMPORTANT]
> **Nunca inicie uma nova branch a partir de uma `main` defasada.** Antes de criar qualquer branch, sempre sincronize com a versão mais recente do repositório remoto:

```bash
git checkout main
git fetch origin main
git pull origin main --ff-only
git checkout -b <tipo>/<nome-da-branch>
```

### Convenção de Branches

- **Com Issue vinculada**: `<tipo>/<id-da-issue>-<descricao-curta>`
  - Ex: `feat/27-async-clients-csv-report`
  - Ex: `fix/30-report-phone-format`
- **Sem Issue vinculada (manutenção, documentação, refatoração interna)**: `<tipo>/<descricao-curta>`
  - Ex: `docs/add-governance-docs`
  - Ex: `chore/bump-dependencies`

| Prefixo | Uso |
| :--- | :--- |
| `feat/` | Novas funcionalidades |
| `fix/` | Correções de bugs |
| `docs/` | Documentação, READMEs e guias |
| `refactor/` | Refatoração de código |
| `test/` | Adição ou correção de testes |
| `chore/` | Ajustes de build, dependências ou scripts |
| `ci/` | Alterações em pipelines do GitHub Actions |

### Padrão de Commits (Conventional Commits)

Utilizamos a especificação [Conventional Commits](https://www.conventionalcommits.org/):

- **Estrutura**: `<tipo>(<escopo>): <descrição clara no imperativo> [(#issue)]`
- **Exemplos**:
  - `feat(reports): gerar relatorio csv de forma assincrona com streaming (#27)`
  - `fix(auth): sanitizar cookie de sessao ao realizar logout`
  - `docs(readme): atualizar instrucoes de setup local`

---

## 🧪 Validação Obrigatória & Scripts Utilitários

Antes de criar qualquer commit ou abrir um Pull Request, execute a suíte de validação:

```bash
./scripts/check.sh all
```

O comando `./scripts/check.sh all` executa de ponta a ponta:
1. **Backend**: `go vet` e execução de 100% dos testes unitários em todos os pacotes.
2. **Frontend**: Verificação de tipos (`tsc`), linters (`eslint`), formatação (`prettier`) e testes (`vitest`).
3. **Terraform**: Validação de formatação (`terraform fmt -check`).

### Outros Scripts Úteis

| Script | Finalidade |
| :--- | :--- |
| `./scripts/check.sh backend` | Valida exclusivamente o backend Go |
| `./scripts/check.sh frontend` | Valida exclusivamente o frontend React |
| `./scripts/fix.sh` | Formata automaticamente o código Go e Frontend |
| `./scripts/swagger.sh` | **Obrigatório** ao alterar rotas ou handlers HTTP da API Go |

---

## 🏗️ Diretrizes de Arquitetura & Qualidade

### Backend (Go & Clean Architecture)
- **Domain First**: As entidades de negócio em `internal/domain/` não devem depender de nenhum framework externo ou banco de dados.
- **Portas & Contratos**: Interfaces em `internal/application/ports/` definem contratos claros para repositórios, storage e autenticação.
- **Casos de Uso**: A lógica da aplicação reside em `internal/application/usecase/`, sendo orquestrada de maneira testável e isolada.
- **Handlers REST**: Localizados em `internal/interfaces/rest/handlers/`, devem apenas validar payloads de entrada, delegar para casos de uso e responder através do utilitário `httpx`.

### Frontend (React 19, TypeScript & MUI)
- **Modularização por Features**: Todo código relacionado a um domínio de negócio reside em `frontend/src/features/<feature>/` (páginas, componentes específicos, serviços e tipos).
- **Material UI v6**: Reutilize a paleta de temas e componentes do `@mui/material`.
- **Estado com Zustand**: Mantenha stores simples, focadas e desacopladas da camada de renderização.
- **Transporte Seguro de Sessão**: Chamadas HTTP via `api.client.ts` utilizam sempre `withCredentials: true` para transporte de cookies `HttpOnly`.

---

## 🛡️ Práticas de Segurança & Defesa em Profundidade

Para manter o alto padrão de segurança do PS:
1. **Isolamento Multi-tenant**: Toda consulta ou mutação de dados de negócio deve validar o `tenantID` extraído diretamente da sessão autenticada.
2. **Sem Armazenamento de Tokens no Frontend**: Tokens JWT não devem ser armazenados em `localStorage` ou `sessionStorage`; o backend gerencia cookies `HttpOnly`, `Secure` e `SameSite=Lax`.
3. **Sanitização de Uploads**: Uploads de arquivos devem ter tipos MIME validados, extensões canônicas verificadas e proteção contra *Path Traversal*.
4. **Tratamento Seguro de Erros**: Nunca retorne stack traces internos ou detalhes de infraestrutura na resposta da API HTTP.

---

## 🚀 Submissão de Pull Requests

1. **Garanta que a branch está rebaseada com a `main`**:
   ```bash
   git fetch origin main
   git rebase origin/main
   ```
2. **Execute as validações locais**:
   ```bash
   ./scripts/check.sh all
   ```
3. **Envie a branch para o repositório remoto**:
   ```bash
   git push origin <sua-branch>
   ```
4. **Abra o Pull Request**:
   - Preencha todos os campos do template padrão de PR.
   - Vincule a issue correspondente (ex: `Closes #123`).
   - Aguarde a conclusão dos workflows de CI do GitHub Actions e a revisão de código.

Agradecemos sua colaboração para tornar o **Photo Storage** cada vez melhor! 🎉
