---
type: frontend
title: "Componentes UI e Design System — PS"
description: "Diretrizes de Material UI v6, tema com cores análogas, acessibilidade e componentes responsivos."
tags:
  - frontend
  - mui
  - design-system
  - theme
  - a11y
  - responsive
timestamp: 2026-10-02
---

# 🎨 Componentes UI e Design System — PS

A identidade visual e a experiência de usuário do **PS (Photo Storage)** baseiam-se na biblioteca **Material UI (MUI v6)**, complementada por uma paleta customizada e regras rígidas de acessibilidade (a11y) e design responsivo.

Para navegação geral, retorne ao [Catálogo Canônico](../index.md).

---

## 🎭 1. Paleta de Cores e Tema (`src/styles/theme.ts`)

A identidade cromática utiliza uma harmonia análoga focada em clareza operacional, contraste elevado e fadiga visual reduzida em sessões prolongadas de curadoria fotográfica:

| Token | Cor Hex | Finalidade |
| :--- | :--- | :--- |
| `primary.main` | `#1E88E5` (Blue 600) | Ações primárias, botões de submissão e links ativos |
| `secondary.main`| `#00897B` (Teal 600) | Destaques contextuais e filtros de temporada |
| `success.main` | `#2E7D32` (Green 800) | Status de pagamentos aprovados e confirmações |
| `warning.main` | `#ED6C02` (Orange 800) | Alertas de limite de plano e trials próximos do fim |
| `error.main` | `#D32F2F` (Red 700) | Exclusões, bloqueios e erros de validação |
| `background.default` | `#F8FAFC` | Fundo geral da aplicação (Slate suave) |
| `background.paper` | `#FFFFFF` | Superfície de cartões, modais e tabelas |

---

## ♿ 2. Acessibilidade (a11y) e Responsividade

1. **Rótulos e Nomes Acessíveis**: Todos os botões que utilizam apenas ícones (`IconButton`) devem conter a propriedade `aria-label` descritiva em conformidade com as diretrizes do WCAG.
2. **Gerenciamento de Foco em Modais**: Modais (`Dialog`, `Modal`) devem confinar o foco do teclado e restaurá-lo para o elemento disparador ao fechar, evitando problemas de acessibilidade em leitores de tela.
3. **Design Responsivo Mobile-First**: O layout do shell SaaS (`AppLayout`) adapta a navegação lateral para uma gaveta deslizante (`Drawer` temporário) em telas de largura `< 900px` (breakpoint `md`), mantendo ações críticas acessíveis por toque.

---

## 🧱 3. Componentes Estruturais Reutilizáveis

- **`AppLayout`**: Contêiner mestre com `Sidebar`, `Topbar` com seletor de temporada ativa e área de conteúdo rolável.
- **`DataTable`**: Tabelas padronizadas com paginação no servidor, ordenação por cabeçalho e feedback de carregamento em esqueleto (`Skeleton`).
- **`ConfirmDialog`**: Modal unificado para operações destrutivas (exclusão de clientes, expiração de tokens).

---

## 🔗 Referências Cruzadas
- [Catálogo Canônico](../index.md)
- [Gerenciamento de Estado com Zustand](state-management.md)
- [Roteamento e RBAC no Frontend](routing-and-rbac.md)
