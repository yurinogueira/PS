---
type: operations
title: "Docker e Ambiente Local de Desenvolvimento — PS"
description: "Orquestração com Docker Compose, scripts de desenvolvimento e resolução rápida de problemas locais."
tags:
  - operations
  - docker
  - compose
  - dev
  - scripts
timestamp: 2026-10-02
---

# 🐳 Docker e Ambiente Local de Desenvolvimento — PS

O desenvolvimento local do **PS (Photo Storage)** é padronizado via **Docker Compose**, permitindo subir toda a stack (MongoDB 9, Backend Go 1.26 e Frontend React 19) com um único comando e sem a necessidade de instalar bancos de dados localmente no sistema operacional do host.

Para navegação geral, retorne ao [Catálogo Canônico](../index.md).

---

## 🚀 Inicialização Rápida

Utilize sempre o script otimizado `scripts/dev.sh`, que fornece respostas limpas e de baixo consumo de tokens:

```bash
# 1. Iniciar todos os serviços em segundo plano:
./scripts/dev.sh start

# 2. Consultar o status dos contêineres e portas ativas:
./scripts/dev.sh status

# 3. Consultar logs em tempo real:
./scripts/dev.sh logs backend
./scripts/dev.sh logs frontend

# 4. Reiniciar apenas um serviço após modificações:
./scripts/dev.sh restart backend

# 5. Parar todos os serviços:
./scripts/dev.sh stop
```

---

## 🔌 Portas e Endpoints Locais

| Serviço | Porta no Host | Endpoint de Acesso |
| :--- | :--- | :--- |
| **Frontend Web App** | `5173` | `http://localhost:5173` |
| **Backend REST API** | `8080` | `http://localhost:8080/api/v1` |
| **Swagger UI** | `8080` | `http://localhost:8080/swagger/index.html` (com `LOG_LEVEL=debug`) |
| **MongoDB Database (v9)** | `27017` | `mongodb://localhost:27017/ps` |

---

## 🛠️ Scripts Auxiliares de Validação e Formatação

| Script | Finalidade | Quando Usar |
| :--- | :--- | :--- |
| `./scripts/check.sh all` | Checagem unificada de qualidade (Go + React + Terraform + Docs) | Antes de qualquer commit ou PR |
| `./scripts/check.sh backend` | Validação rápida de `go vet` e testes do Go | Durante iterações na API |
| `./scripts/check.sh frontend` | Typecheck (`tsc`), ESLint, Prettier e Vitest | Durante iterações na UI |
| `./scripts/check.sh docs` | Validação da integridade do bundle OKF | Ao editar qualquer arquivo em `docs/` |
| `./scripts/fix.sh` | Formata automaticamente Go (`go fmt`) e Frontend (`prettier`, `eslint`) | Para corrigir divergências estéticas |
| `./scripts/swagger.sh` | Regenera a documentação OpenAPI Swaggo | Ao adicionar/modificar rotas HTTP |

---

## 🔗 Referências Cruzadas
- [Catálogo Canônico](../index.md)
- [Ambiente e Configurações](environment-and-config.md)
- [Deploy e Topologia de Nuvem](deploy-and-infrastructure.md)
- [Pipelines de CI/CD](ci-cd-pipelines.md)
