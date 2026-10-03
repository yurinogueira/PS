---
type: adr
title: "ADR 0004: Sistema de Documentação Canônica Baseado no Padrão OKF"
description: "Decisão de implementar o Open Knowledge Format (OKF) do Google Cloud como padrão para o repositório de conhecimento e LLM Wiki."
tags:
  - adr
  - documentation
  - okf
  - llm-wiki
  - knowledge-base
timestamp: 2026-10-02
---

# 📜 ADR 0004: Sistema de Documentação Canônica Baseado no Padrão OKF

- **Status**: Aceito
- **Data**: 2026-10-02
- **Decisores**: Equipe de Engenharia PS

Para navegação geral, retorne ao [Catálogo Canônico](../index.md).

---

## 📌 Contexto
Com o uso intensivo de agentes de inteligência artificial autônomos no desenvolvimento e manutenção do projeto **PS (Photo Storage)**, a ausência de uma base canônica estruturada gerava alto consumo de tokens em comandos de pesquisa, alucinações sobre contratos de API e divergências entre regras de domínio e código implementado.

---

## 💡 Decisão
Adotamos o **Open Knowledge Format (OKF)** do Google Cloud como padrão para todo o acervo de conhecimento do projeto, alocado sob a pasta raiz `docs/`:

1. Cada documento Markdown contém obrigatoriamente um cabeçalho YAML frontmatter com campo `type:` padronizado (`index`, `log`, `architecture`, `domain`, `frontend`, `operations`, `adr`, `runbook`).
2. O catálogo central `docs/index.md` provê navegação em árvore e mapa conceitual com suporte a divulgação progressiva (*progressive disclosure*).
3. Todas as conexões conceituais utilizam links relativos válidos do Markdown, formando um grafo navegável.
4. Um script determinístico `scripts/check-docs.sh` valida a integridade sintática e a resolução de links antes de qualquer commit ou merge no GitHub Actions.

---

## ⚖️ Consequências

### Positivas:
- **Redução de Tokens**: Agentes de IA navegam progressivamente pelo catálogo em vez de carregar bases inteiras de código.
- **Prevenção de Alucinações**: Decisões de arquitetura, contratos e entidades de domínio possuem fonte única e oficial.
- **Validação Automatizada**: Nenhum link quebrado ou documento órfão entra na branch `main`.

### Negativas / Desafios:
- Disciplina mandatória para atualizar os documentos correspondentes sempre que o código de domínio ou arquitetura for alterado.

---

## 🔗 Referências Cruzadas
- [Catálogo Canônico](../index.md)
- [Log de Modificações](../log.md)
- [Visão Geral da Arquitetura](../architecture/overview.md)
- [Pipelines de CI/CD](../operations/ci-cd-pipelines.md)
