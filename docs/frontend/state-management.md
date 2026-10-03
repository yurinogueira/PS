---
type: frontend
title: "Gerenciamento de Estado com Zustand — PS"
description: "Padrões de gerenciamento de estado global no frontend, isolamento de sessão e proteção contra vazamento de tokens."
tags:
  - frontend
  - zustand
  - state-management
  - react
  - security
timestamp: 2026-10-02
---

# 🧠 Gerenciamento de Estado com Zustand — PS

A aplicação SPA em React 19 adota o **Zustand** como biblioteca padrão para o gerenciamento de estado global da interface, priorizando performance, ausência de *boilerplate* e total segurança de dados.

Para navegação geral, retorne ao [Catálogo Canônico](../index.md).

---

## 🎯 Princípios Fundamentais

1. **Estado Confinado à UI e Perfil Público**: As stores do Zustand gerenciam exclusivamente estados visuais da interface (sidebar aberta/fechada, modais, tema) e o perfil público do usuário logado.
2. **Proibição de Tokens no Estado do Cliente**: Em alinhamento com a arquitetura de [Autenticação e Segurança](../architecture/auth-and-security.md) e o [ADR 0003](../adrs/0003-zustand-state-management.md), tokens de acesso JWT **NUNCA** são manipulados ou armazenados nas stores Zustand nem persistidos em `localStorage`.
3. **Stores Descentralizadas por Feature**: Em vez de uma megastore monolítica, cada módulo de funcionalidade (`features/<nome>/state/`) encapsula sua própria store atômica.

---

## 🧩 Implementação de Referência (`useAuthStore`)

Localizada em `frontend/src/features/auth/state/auth.store.ts`:

```typescript
import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  superAdmin: boolean;
  tenantId: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

---

## 🔄 Fluxo de Inicialização e Sincronização

1. Ao carregar a SPA no navegador, o layout raiz dispara uma requisição `GET /api/v1/users/me` através do cliente Axios configurado com `withCredentials: true`.
2. Se o cookie `ps_access_token` for válido, a API responde com os dados do perfil, e o hook `setUser(data)` popula a store.
3. Se a requisição falhar com `401 Unauthorized`, a store permanece com `isAuthenticated: false` e redireciona o usuário para a página `/login`.

---

## 🔗 Referências Cruzadas
- [Catálogo Canônico](../index.md)
- [Autenticação e Segurança em Camadas](../architecture/auth-and-security.md)
- [Roteamento e RBAC no Frontend](routing-and-rbac.md)
- [Componentes UI e Design System](ui-components.md)
- [ADR 0003: Zustand State Management](../adrs/0003-zustand-state-management.md)
