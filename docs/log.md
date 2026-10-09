---
type: log
title: "Log de Modificações e Evoluções — PS"
description: "Índice cronológico central das alterações e evoluções de engenharia, arquitetura e domínio do PS."
tags:
  - log
  - changelog
  - okf
  - index
timestamp: 2026-10-09
---

# 📜 Log de Modificações da Base de Conhecimento — PS

Este arquivo é o **Índice Cronológico Central** de modificações do **PS (Photo Storage)**.
Para evitar arquivos excessivamente extensos e otimizar o consumo de tokens pelos agentes de inteligência artificial, o detalhamento das intervenções de cada data é particionado em arquivos diários dedicados na pasta `docs/logs/`.

Para acessar o índice estrutural completo de toda a documentação, consulte o [Catálogo Canônico (docs/index.md)](index.md).

---

## 📅 [2026-10-09](logs/2026-10-09.md) — Intervenções em UI, Segurança, Limpeza e Governança
- **[Layout & Responsividade Intermediária](logs/2026-10-09.md#🎯-correção-de-layout-e-sobreposição-em-resolução-intermediária-1072x819-issue-131)** (Issue #131): Resolução de truncamento no Topbar, overflow e corte de ações no Dashboard e empilhamento responsivo no Master-Detail de pessoas.
- **[Particionamento Diário de Logs](logs/2026-10-09.md#🎯-particionamento-diário-de-logs-da-base-de-conhecimento-docslogs-aaaa-mm-ddmd)**: Migração para arquitetura particionada por data (`docs/logs/AAAA-MM-DD.md`) com catálogo central (`docs/log.md`), reduzindo o consumo de tokens e eliminando conflitos de merge no Git.
- **[i18n & Fotógrafos](logs/2026-10-09.md#correção-de-chave-i18n-na-raça-e-filtragem-de-fotógrafos-pelo-evento-ativo-issue-132)** (Issue #132): Correção da chave de tradução `breed` e restrição da lista de fotógrafos aos profissionais ativos no evento.
- **[Saneamento de Scripts](logs/2026-10-09.md#remoção-de-scripts-legados-de-migração-e-saneamento-da-raiz-do-projeto)**: Remoção de 15 scripts Python temporários e limpeza de resíduos legados na raiz do projeto.
- **[Governança Zero-Divergence](logs/2026-10-09.md#política-de-governança-de-documentação-contínua-okf--trilha-histórica-pr-133)** (PR #133): Instituição da obrigatoriedade de atualização documental contínua e Quality Gate automatizado via script e CI.
- **[Navegação Lateral](logs/2026-10-09.md#priorização-de-eventos-na-navegação-lateral-e-redirecionamento-pr-130-issue-109)** (PR #130, Issue #109): Eventos movidos para o topo do menu e fluxo com redirecionamento ao selecionar evento ativo.
- **[Dependência source-map-js](logs/2026-10-09.md#atualização-da-dependência-source-map-js-para-122-pr-129)** (PR #129): Bump para 1.2.2 no frontend.
- **[Fotos e Competições](logs/2026-10-09.md#vinculação-de-fotos-a-múltiplas-competições-pr-128-issue-111)** (PR #128, Issue #111): Suporte à associação de fotos a múltiplas competições no backend e frontend.
- **[Dessincronização de Role JWT](logs/2026-10-09.md#mitigação-de-dessincronização-de-role-em-sessão-ativa-e-auto-escalonamento-pr-127-issue-118)** (PR #127, Issue #118): Revalidação do usuário no middleware, trava de auto-escalonamento de admin e Go 1.26.
- **[Moeda Estrangeira OTHER](logs/2026-10-09.md#moeda-estrangeira-genérica-other-e-segregação-na-arrecadação-pr-126-issue-108)** (PR #126, Issue #108): Adição de suporte a moedas genéricas internacionais e totalizadores segregados.
- **[Ação Rápida no Dashboard](logs/2026-10-09.md#botão-de-ação-rápida---e-modal-adddogmodal-na-visão-geral-pr-125-issue-107)** (PR #125, Issue #107): Botão (+ 🐾) e modal `AddDogModal` para cadastro imediato na visão geral.

---

## 📅 [2026-10-07](logs/2026-10-07.md) — Infraestrutura e Banco de Dados
- **[MongoDB 9](logs/2026-10-07.md#atualização-do-mongodb-para-versão-9-no-docker-compose-pr-123)** (PR #123): Atualização da imagem oficial do banco no `docker-compose.yml` para versão 9.

---

## 📅 [2026-10-05](logs/2026-10-05.md) — Atualização de Dependências e Terraform
- **[Dependências do Frontend](logs/2026-10-05.md#atualização-de-dependências-do-frontend-pr-124)** (PR #124): Atualização de Vite 6.2.0 e pacotes de build.
- **[Terraform OCI](logs/2026-10-05.md#atualização-de-provedores-oci-no-terraform-pr-122)** (PR #122): Atualização de locks dos provedores de nuvem Oracle Cloud.

---

## 📅 [2026-10-02](logs/2026-10-02.md) — Bootstrap do Sistema Canônico OKF
- **[Bootstrap OKF](logs/2026-10-02.md#implementação-do-sistema-canônico-okf-issue-119)** (Issue #119): Criação inicial do Knowledge Bundle (arquitetura, subdomínios DDD, frontend, operações, ADRs, catálogo `index.md` e script de integridade `check-docs.sh`).
