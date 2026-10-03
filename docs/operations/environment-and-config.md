---
type: operations
title: "Ambiente e Configurações — PS"
description: "Matriz de variáveis de ambiente, segredos, paridade dev/prod e precedência de configuração."
tags:
  - operations
  - config
  - env
  - secrets
  - security
timestamp: 2026-10-02
---

# ⚙️ Ambiente e Configurações — PS

O ecossistema do **PS (Photo Storage)** segue o princípio *Twelve-Factor App*, mantendo a configuração estritamente segregada do código-fonte através de variáveis de ambiente.

Para navegação geral, retorne ao [Catálogo Canônico](../index.md).

---

## 📋 Matriz de Variáveis de Ambiente

| Variável | Descrição | Exemplo Local | Exemplo Produção |
| :--- | :--- | :--- | :--- |
| `PORT` | Porta HTTP da API Go | `8080` | `8080` |
| `LOG_LEVEL` | Nível de log (`debug`, `info`, `warn`, `error`) | `debug` | `info` |
| `JWT_SECRET` | Chave de assinatura do `ps_access_token` (min. 32 chars) | `<chave-local>` | `<segredo-forte-openssl>` |
| `JWT_REFRESH_SECRET` | Chave de assinatura do `ps_refresh_token` (min. 32 chars) | `<chave-local>` | `<segredo-forte-openssl>` |
| `MONGO_URI` | String de conexão com o cluster MongoDB | `mongodb://localhost:27017` | `mongodb+srv://...` |
| `MONGO_DATABASE` | Nome da base de dados | `ps` | `ps` |
| `STORAGE_PROVIDER` | Driver de armazenamento (`local` ou `oci`) | `local` | `local` / `oci` |
| `UPLOAD_PATH` | Diretório de montagem de arquivos locais | `./data/uploads` | `/opt/ps/data/uploads` |
| `ALLOWED_ORIGINS` | Origens CORS permitidas (separadas por vírgula) | `http://localhost:5173` | `https://ps.yurinogueira.dev.br` |
| `COOKIE_DOMAIN` | Domínio atribuído aos cookies de sessão | `localhost` | `.yurinogueira.dev.br` |
| `COOKIE_SECURE` | Exigir HTTPS para transmissão de cookies | `false` | `true` |

---

## 🔐 Gestão e Rotação de Segredos

> [!WARNING]
> **Nunca comite valores reais de segredos no Git**. Arquivos `.env` estão inclusos no `.gitignore`. Utilize sempre os modelos `.env.example` e `deploy/backend.env.example` como referência de contratos.

### Como Gerar Segredos Fortes para Produção:
```bash
# Gerar chave JWT_SECRET:
openssl rand -base64 32

# Gerar chave JWT_REFRESH_SECRET:
openssl rand -base64 32
```

---

## 🔗 Referências Cruzadas
- [Catálogo Canônico](../index.md)
- [Autenticação e Segurança em Camadas](../architecture/auth-and-security.md)
- [Docker e Ambiente Local](docker-and-local-dev.md)
- [Deploy e Topologia de Nuvem](deploy-and-infrastructure.md)
