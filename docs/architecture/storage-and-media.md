---
type: architecture
title: "Armazenamento e Gestão de Mídia — PS"
description: "Abstração de storage, sanitização defensiva de caminhos de arquivos e integração com OCI Object Storage."
tags:
  - architecture
  - storage
  - media
  - path-traversal
  - oci-object-storage
timestamp: 2026-10-02
---

# 📸 Armazenamento e Gestão de Mídia — PS

O armazenamento de alta densidade de imagens fotográficas, exportações de dados e relatórios assíncronos é um dos pilares do **PS (Photo Storage)**.

Este documento estabelece as diretrizes de abstração de infraestrutura, os padrões de segurança contra ataques de travessia de diretório (*Path Traversal*) e a integração com provedores de nuvem.

Para navegação geral, retorne ao [Catálogo Canônico](../index.md).

---

## 🎛️ 1. Abstração de Armazenamento (`StorageService`)

A camada de aplicação não acessa o sistema de arquivos local ou SDKs de nuvem diretamente. Todas as operações de I/O são orquestradas via contrato definido em `backend/internal/application/ports/storage/`:

```go
type StorageService interface {
    Save(ctx context.Context, path string, reader io.Reader) (string, error)
    Get(ctx context.Context, path string) (io.ReadCloser, error)
    Delete(ctx context.Context, path string) error
    GetURL(ctx context.Context, path string) (string, error)
}
```

### Implementações Suportadas:
1. **LocalStorage (`backend/internal/infrastructure/storage/local`)**:
   - Utilizado em ambiente de desenvolvimento local e execução via Docker Compose.
   - Armazena arquivos sob o volume montado `/data/storage`.
2. **OCI Object Storage (`backend/internal/infrastructure/storage/oci`)**:
   - Utilizado em ambiente de produção na nuvem da Oracle Cloud Infrastructure.
   - Armazena imagens em buckets privados protegidos com URLs pré-assinadas (*Pre-authenticated Requests - PAR*) de expiração temporária.

---

## 🛡️ 2. Sanitização Defensiva contra Path Traversal

Ao manipular arquivos no storage local, é expressamente proibido confiar em nomes de arquivo fornecidos pelo usuário ou caminhos relativos arbitrários (`../`).

O componente `LocalStorage` aplica sanitização defensiva:
- Limpeza do caminho através de `filepath.Clean`.
- Validação de confinamento no diretório base (`filepath.HasPrefix(targetPath, baseDir)`). Se a rota resultante escapar do diretório raiz configurado, a operação é rejeitada imediatamente com erro de segurança.
- Identificadores de arquivos utilizam obrigatoriamente UUIDs aleatórios gerados pelo backend:
  ```text
  /data/storage/{tenant_id}/{ano}/{mes}/{uuid}.{ext}
  ```

---

## ⏱️ 3. Retenção e Expiração de Relatórios Temporários (TTL)

Exportações massivas em formato CSV ou relatórios administrativos gerados de forma assíncrona ([Subdomínio de Relatórios](../domain/report.md)) possuem ciclo de vida temporário:

1. O relatório gerado é salvo com chave temporária: `reports/{tenant_id}/{export_id}.csv`.
2. Uma rotina de background worker monitora o timestamp de criação.
3. Arquivos com mais de **24 horas** de criação são excluídos automaticamente tanto do disco/bucket quanto da coleção de relatórios no MongoDB.

---

## 🔗 Referências Cruzadas
- [Visão Geral da Arquitetura](overview.md)
- [Multi-tenancy e Isolamento de Dados](multitenancy-and-data.md)
- [Subdomínio de Relatórios](../domain/report.md)
- [Deploy e Topologia de Nuvem](../operations/deploy-and-infrastructure.md)
