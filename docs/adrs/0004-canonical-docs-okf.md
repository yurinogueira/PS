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

## 📜 Adendo de Governança (2026-10-09): Documentação Contínua & Trilha Histórica Mandatória

Em auditoria após os primeiros ciclos de desenvolvimento (PRs #122 a #130), constatou-se que alterações pontuais de dependências, novas telas, rotas e correções de bugs foram integradas sem atualizar os documentos correspondentes ou o registro cronológico em `docs/log.md`. Para mitigar qualquer risco de desatualização (*doc rot*), estabelece-se a regra inegociável:

1. **Escopo Universal**: A sincronização documental e o registro datado em `docs/log.md` aplicam-se a **100% das tarefas**:
   - `feat` (novas funcionalidades/rotas/telas)
   - `fix` (correções de bugs/segurança)
   - `chore`/`deps`/`ci` (atualização de versões de Go, Node, MongoDB, libs e terraform)
   - `refactor`/`perf` (reestruturações e otimizações)
2. **Registro Datado em `docs/log.md`**: Cada PR ou commit de entrega deve conter uma nova seção datada (`YYYY-MM-DD`) descrevendo a intervenção técnica e os arquivos de documentação alterados.
3. **Quality Gate Restritivo**: PRs sem a devida atualização e registro em `docs/log.md` são bloqueados na revisão e nos checklists de agentes.

---

## 🔗 Referências Cruzadas
- [Catálogo Canônico](../index.md)
- [Log de Modificações](../log.md)
- [Visão Geral da Arquitetura](../architecture/overview.md)
- [Pipelines de CI/CD](../operations/ci-cd-pipelines.md)
