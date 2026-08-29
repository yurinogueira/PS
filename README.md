# 📸 PS - Photo Storage

<div align="center">

![Go](https://img.shields.io/badge/Go-1.25-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Material UI](https://img.shields.io/badge/Material_UI-v6-007FFF?style=for-the-badge&logo=mui&logoColor=white)
![CI Backend](https://img.shields.io/github/actions/workflow/status/yurinogueira/PS/backend.yml?branch=main&label=CI%20Backend&style=for-the-badge)
![CI Frontend](https://img.shields.io/github/actions/workflow/status/yurinogueira/PS/frontend.yml?branch=main&label=CI%20Frontend&style=for-the-badge)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)

**Plataforma moderna para armazenamento, gestão inteligente de fotografias, eventos, temporadas, fotógrafos e clientes.**

[Acessar Web App](https://ps.yurinogueira.dev.br)

</div>

---

## 📌 Links de Produção

| Serviço | URL | Descrição |
| :--- | :--- | :--- |
| **🌐 Web App** | [ps.yurinogueira.dev.br](https://ps.yurinogueira.dev.br) | Aplicação SPA em produção (GitHub Pages + Cloudflare) |
| **⚡ API REST** | [api-ps.yurinogueira.dev.br](https://api-ps.yurinogueira.dev.br) | Backend em Go com Clean Architecture hospedado na OCI |

---

## 🌟 Funcionalidades

- 🔐 **Autenticação Segura & Multi-tenant (RBAC)**: Sessões gerenciadas via cookies `HttpOnly` com suporte a refresh token automático, recuperação e verificação de e-mail e controle de acesso baseado em papéis (SuperAdmin, Admin, Fotógrafo/Usuário).
- 📸 **Gestão de Fotógrafos & Clientes**: Cadastro, listagem, filtros e gestão de fotógrafos parceiros e clientes atendidos com controle de cobrança e histórico.
- 🏆 **Temporadas e Eventos**: Organização de coberturas fotográficas por temporadas de eventos e competições com agrupamento temático e temporal.
- 👥 **Gestão de Pessoas & Participantes**: Registro e identificação de pessoas associadas aos eventos, ensaios e fotografias.
- 📊 **Relatórios & Exportação Assíncrona**: Geração e download sob demanda de relatórios completos em formato CSV com streaming eficiente e baixo consumo de memória.
- 🛡️ **Segurança em Camadas**: CORS estrito, rate limiting defensivo por IP, proteção contra Path Traversal, cabeçalhos de segurança HTTP (HSTS, CSP, X-Frame-Options) e sanitização rigorosa de payloads.

---

## 🏗️ Arquitetura & Stack Tecnológica

### Backend (Go)
- **Linguagem**: Go 1.25
- **Arquitetura**: Clean Architecture + Domain-Driven Design (DDD)
  - `internal/domain/`: Entidades de negócio puras (auth, client, person, photographer, season, tenant, user).
  - `internal/application/ports/`: Contratos e interfaces de repositórios e serviços.
  - `internal/application/usecase/`: Casos de uso e orquestração de regras de negócio.
  - `internal/infrastructure/`: Implementações de banco de dados (MongoDB), JWT, bcrypt e storage.
  - `internal/interfaces/rest/`: Handlers HTTP REST, roteamento e documentação Swagger com Swaggo.
- **Banco de Dados**: MongoDB 8 (Local) e MongoDB Atlas (Produção).

### Frontend (React)
- **Framework & Ferramentas**: React 19, TypeScript, Vite, React Router v7.
- **UI & Estilização**: Material UI (MUI v6) com `@mui/icons-material` e paleta de cores personalizada.
- **Gerenciamento de Estado**: Zustand (gerenciamento desacoplado de estado da UI e autenticação).
- **Comunicação HTTP**: Axios configurado com `withCredentials: true` para transporte automático de cookies `HttpOnly`.

### Infraestrutura & DevOps
- **Containerização**: Docker e Docker Compose para ambiente de desenvolvimento reprodutível.
- **Nuvem & Hospedagem**: Oracle Cloud Infrastructure (OCI Compute Instance, VCN, Reserved IP).
- **Edge & DNS**: Cloudflare com SSL/TLS Full, proteção DDoS e proxy DNS.
- **Infraestrutura como Código**: Terraform para provisionamento automatizado de recursos OCI, MongoDB Atlas e Cloudflare DNS.
- **CI/CD**: GitHub Actions para validação de testes, linters, build e deploy automático.

---

## 📂 Estrutura do Repositório

```text
PS/
├── backend/                  # API REST em Go (Clean Architecture)
│   ├── cmd/api/              # Ponto de entrada (main.go)
│   ├── docs/                 # Documentação Swagger gerada
│   ├── internal/             # Domain, Use Cases, Infrastructure, Handlers
│   └── Dockerfile            # Container de produção Go
├── frontend/                 # Aplicação SPA em React 19 + Vite
│   ├── src/
│   │   ├── features/         # Módulos: admin, auth, clients, dashboard, people, photographers, profile, reports, seasons
│   │   ├── layouts/          # Shell da aplicação (Sidebar, Topbar, AppLayout)
│   │   ├── routes/           # Rotas públicas e rotas protegidas
│   │   └── services/         # Clientes de API e storage seguro
│   └── Dockerfile            # Container de build/produção Frontend
├── deploy/                   # Configurações de Caddy, systemd e exemplos de env
├── scripts/                  # Scripts otimizados de checagem, build e dev
├── terraform/                # Definições IaC (OCI, Cloudflare, Mongo Atlas)
└── docker-compose.yml        # Stack completa para desenvolvimento local
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- [Docker](https://www.docker.com/) e Docker Compose instalados **OU**
- [Go 1.25+](https://golang.org/) e [Node.js 22+](https://nodejs.org/)

### 1. Clonar o Repositório

```bash
git clone https://github.com/yurinogueira/PS.git
cd PS
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo para `.env`:

```bash
cp .env.example .env
```

### 3. Executar com Docker Compose (Recomendado)

Inicie todos os serviços (MongoDB, Backend Go e Frontend React):

```bash
./scripts/dev.sh start
```

Ou diretamente pelo Docker Compose:

```bash
docker compose up -d
```

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:8080`
- **Swagger UI**: `http://localhost:8080/swagger/index.html`

Para verificar o status ou logs dos containers:

```bash
./scripts/dev.sh status
./scripts/dev.sh logs
```

Para encerrar os serviços:

```bash
./scripts/dev.sh stop
```

---

## 💻 Desenvolvimento & Scripts Úteis

O repositório inclui utilitários em `scripts/` para desenvolvimento ágil e validação de código:

| Script | Finalidade |
| :--- | :--- |
| `./scripts/check.sh all` | Executa testes unitários, type-checking, linters e formatação em todo o projeto |
| `./scripts/check.sh backend` | Valida apenas o backend Go (`go vet` e `go test`) de forma concisa |
| `./scripts/check.sh frontend` | Valida apenas o frontend React (`tsc`, `eslint`, `vitest`) |
| `./scripts/fix.sh` | Formata automaticamente o código Go (`go fmt`) e Frontend (`prettier`, `eslint --fix`) |
| `./scripts/swagger.sh` | Regenera a documentação OpenAPI/Swagger a partir das anotações dos handlers |
| `./scripts/dev.sh start\|stop\|status` | Gerencia o ciclo de vida dos containers Docker |

---

## 🔒 Segurança

Diretrizes de segurança e canais para reporte responsável de vulnerabilidades estão documentados em [SECURITY.md](.github/SECURITY.md).

---

## 🤝 Contribuição & Comunidade

Contribuições são muito bem-vindas! Por favor, leia nosso [Guia de Contribuição](CONTRIBUTING.md) para conhecer o fluxo de desenvolvimento, convenções de commits e padrões de teste, e consulte nosso [Código de Conduta](CODE_OF_CONDUCT.md).

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">
Desenvolvido por <a href="https://github.com/yurinogueira">Yuri Nogueira</a>
</div>
