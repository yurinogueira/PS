---
type: operations
title: "Pipelines de Integração e Entrega Contínua (CI/CD) — PS"
description: "Workflows de automação com GitHub Actions, validação de testes, linters, documentação e deploy contínuo."
tags:
  - operations
  - ci-cd
  - github-actions
  - automation
  - quality-gates
timestamp: 2026-10-02
---

# 🚀 Pipelines de Integração e Entrega Contínua (CI/CD) — PS

O ciclo de vida de validação e entrega no **PS (Photo Storage)** é automatizado através de workflows do **GitHub Actions**, assegurando gates de qualidade rigorosos antes de qualquer mesclagem na branch `main`.

Para navegação geral, retorne ao [Catálogo Canônico](../index.md).

---

## 🗂️ Matriz de Workflows (`.github/workflows/`)

| Workflow | Arquivo | Gatilhos | Responsabilidades |
| :--- | :--- | :--- | :--- |
| **Backend CI & Build** | `backend.yml` | `pull_request` & `push` em `backend/**` ou `deploy/**` | Setup Go 1.26, `go vet`, testes Go, compilação de binário linux/amd64 stripped e deploy OCI na `main`. |
| **Frontend CI & Deploy** | `frontend.yml` | `pull_request` & `push` em `frontend/**` | Typecheck (`tsc`), ESLint, Prettier, Vitest, build de produção e publicação no GitHub Pages. |
| **Terraform IaC Validation**| `terraform.yml`| `pull_request` & `push` em `terraform/**` | `terraform fmt`, `terraform validate` e análise de segurança de infraestrutura. |
| **Docs Quality Gate** | `docs.yml` | `pull_request` irrestrito na `main` & `push` em `docs/**`/scripts | Validação de sintaxe OKF, links Markdown, catálogo indexado e Zero-Divergence (`--verify-sync`) exigindo docs e log para PRs de código. |
| **Dependabot Automation** | `dependabot-automation.yml` | PRs gerados pelo bot do Dependabot | Validação e aprovação segura de atualizações de dependências menores. |

---

## 🛑 Gates de Qualidade Mandatórios para Pull Requests

Nenhum código é integrado à branch `main` sem atender a todos os seguintes critérios:

```mermaid
flowchart LR
    PR[Pull Request Aberto] --> VET[Go Vet & Tests Pass (Go 1.26)]
    PR --> TSC[TypeScript & ESLint Pass]
    PR --> DOC[OKF Docs Integrity & Zero-Divergence Pass]
    PR --> FMT[Prettier & TF Fmt Pass]

    VET & TSC & DOC & FMT --> MERGE[Merge Aprovado para 'main']
```

1. **Backend**: 100% dos testes unitários passando e `go vet` sem advertências (Go 1.26).
2. **Frontend**: Zero erros de TypeScript (`tsc -b`), linting impecável e testes Vitest aprovados.
3. **Documentação Canônica & Zero-Divergence**: Zero links quebrados no grafo Markdown, conformidade estrita com o padrão Open Knowledge Format e verificação obrigatória de Zero-Divergence (`scripts/check-docs.sh --verify-sync`), exigindo que qualquer alteração de código ou infraestrutura seja acompanhada pela respectiva documentação canônica em `docs/` e pelo registro datado em `docs/log.md`.
4. **Formatação**: Código Go formatado com `go fmt`, frontend com `prettier` e Terraform com `terraform fmt`.

---

## 🔗 Referências Cruzadas
- [Catálogo Canônico](../index.md)
- [Ambiente e Configurações](environment-and-config.md)
- [Deploy e Topologia de Nuvem](deploy-and-infrastructure.md)
- [Docker e Ambiente Local](docker-and-local-dev.md)
- [Runbook: Release e Rollback](runbooks/release-and-rollback.md)
