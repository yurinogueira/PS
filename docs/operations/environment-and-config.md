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
timestamp: 2026-10-29
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
| `STORAGE_PROVIDER` | Driver de armazenamento (`local` ou `oci`) | `local` | `oci` |
| `UPLOAD_PATH` | Diretório de montagem de arquivos locais | `./data/uploads` | `/opt/ps/data/uploads` |
| `OCI_STORAGE_BUCKET` | Nome do bucket no OCI Object Storage | `ps-files` | `ps-files` |
| `OCI_STORAGE_NAMESPACE` | Namespace do OCI Object Storage | `<namespace>` | `<namespace>` |
| `OCI_STORAGE_REGION` | Região do OCI Object Storage | `sa-saopaulo-1` | `sa-saopaulo-1` |
| `OCI_STORAGE_ENDPOINT` | Endpoint PAR autenticado (gerado via Terraform) | `""` | `https://objectstorage.sa-saopaulo-1.oraclecloud.com/p/.../n/.../b/ps-files/o/` |
| `ALLOWED_ORIGINS` | Origens CORS permitidas (separadas por vírgula) | `http://localhost:5173` | `https://ps.yurinogueira.dev.br` |
| `COOKIE_DOMAIN` | Domínio atribuído aos cookies de sessão | `localhost` | `.yurinogueira.dev.br` |
| `COOKIE_SECURE` | Exigir HTTPS para transmissão de cookies | `false` | `true` |
| `SMTP_HOST` | Host do servidor SMTP | `""` | `smtp.resend.com` |
| `SMTP_PORT` | Porta do servidor SMTP | `587` | `587` |
| `SMTP_USER` | Usuário do servidor SMTP | `""` | `resend` |
| `SMTP_PASS` | Senha/API Key do servidor SMTP | `""` | `<token-resend>` |
| `EMAIL_FROM` | Remetente autenticado de e-mails | `no-reply@ps.com.br` | `no-reply@yurinogueira.dev.br` |
| `APP_BASE_URL` | URL base pública da aplicação | `http://localhost:5173` | `https://ps.yurinogueira.dev.br` |

---

## ☁️ Provedor OCI Object Storage com Autenticação PAR

No ambiente de produção na nuvem da Oracle Cloud Infrastructure, os arquivos e relatórios do PS são armazenados no bucket privado `ps-files`.

### Características da Integração:
- **Infraestrutura como Código (Terraform)**: O recurso `oci_objectstorage_preauthrequest.files_par` em `terraform/object_storage.tf` provisiona uma Solicitação Pré-Autenticada (PAR) com permissões `AnyObjectReadWrite` e listagem de objetos (`ListObjects`).
- **Resolução Automática via Pipeline (CI/CD)**: O workflow `.github/workflows/backend.yml` executa o passo `Resolve Terraform outputs from OCI state`, baixando `terraform.tfstate` do bucket de estado e extraindo a URL de `object_storage_endpoint` em tempo de execução sem requerer secrets manuais adicionais.
- **Sincronização Local**: O script `scripts/sync-env.sh` captura o output `object_storage_endpoint` diretamente do Terraform e configura automaticamente `/etc/ps/backend.env` na VM.
- **Driver OCI**: A camada de infraestrutura `backend/internal/infrastructure/storage/oci` consome a URL pré-autenticada para realizar uploads (`PUT`), downloads (`GET`) e exclusões (`DELETE`) de forma atômica e segura.

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
