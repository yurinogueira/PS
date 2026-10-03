---
type: adr
title: "ADR 0003: Gerenciamento de Estado Descentralizado com Zustand"
description: "Decisão de utilizar Zustand em vez de Redux Toolkit ou Context API para o gerenciamento de estado no frontend React 19."
tags:
  - adr
  - frontend
  - zustand
  - react
  - state-management
timestamp: 2026-10-02
---

# 📜 ADR 0003: Gerenciamento de Estado Descentralizado com Zustand

- **Status**: Aceito
- **Data**: 2026-10-02
- **Decisores**: Equipe de Engenharia PS

Para navegação geral, retorne ao [Catálogo Canônico](../index.md).

---

## 📌 Contexto
Com a migração para React 19 e a necessidade de coordenar estados globais simples (sessão pública, preferências visuais de interface, filtros da temporada ativa), o uso de Context API causava re-renderizações excessivas em árvores profundas de componentes. O Redux Toolkit, por outro lado, adicionava boilerplate desproporcional para as necessidades da aplicação.

---

## 💡 Decisão
Adotamos o **Zustand** como biblioteca padrão de gerenciamento de estado global no frontend:

1. Estruturação descentralizada: cada feature encapsula sua própria store (`src/features/<feature>/state/`).
2. Sem necessidade de Providers: componentes leem seletivamente fatias de estado com re-renderizações mínimas.
3. Compatibilidade nativa com TypeScript sem decorators ou código gerado.

---

## ⚖️ Consequências

### Positivas:
- **Alta Performance**: Atualizações de estado acionam renderização apenas dos componentes que assinam a propriedade exata.
- **Simplicidade**: Curva de aprendizado mínima e código limpo, facilitando manutenções por desenvolvedores e agentes de IA.
- **Tamanho de Bundle Reduzido**: A biblioteca adiciona menos de 3KB ao bundle final.

### Negativas / Desafios:
- A flexibilidade exige disciplina dos desenvolvedores para não acoplar lógica de chamadas de rede diretamente nas stores.

---

## 🔗 Referências Cruzadas
- [Catálogo Canônico](../index.md)
- [Gerenciamento de Estado no Frontend](../frontend/state-management.md)
- [Componentes UI e Design System](../frontend/ui-components.md)
