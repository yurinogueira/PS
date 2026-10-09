---
type: frontend
title: "Roteamento e Controle de Acesso (RBAC) — PS"
description: "Organização de rotas com React Router v7, proteção de páginas com ProtectedRoute e controle RBAC."
tags:
  - frontend
  - react-router
  - rbac
  - security
  - routing
timestamp: 2026-10-02
---

# 🛣️ Roteamento e Controle de Acesso (RBAC) — PS

A navegação da Single Page Application do **PS (Photo Storage)** é orquestrada pelo **React Router v7**, com proteção declarativa de rotas baseada na sessão do usuário e suas permissões hierárquicas (RBAC).

Para navegação geral, retorne ao [Catálogo Canônico](../index.md).

---

## 🗺️ Mapa de Rotas da Aplicação (`frontend/src/routes/index.tsx`)

As rotas são segregadas em dois grupos:

### 1. Rotas Públicas (Sem Autenticação)
- `/login`: Autenticação de usuários existentes.
- `/register`: Cadastro de novas contas.
- `/forgot-password`: Solicitação de link de redefinição de credenciais.
- `/reset-password`: Redefinição de senha com token criptográfico temporário.
- `/verify-email`: Confirmação do endereço de e-mail do titular.

### 2. Rotas Privadas (Protegidas)
Renderizadas dentro do shell SaaS principal (`AppLayout`), que engloba a `Sidebar` e a `Topbar`:
- `/`: Redirecionamento automático para `/dashboard`.
- `/seasons`: Gestão e alternância de eventos/temporadas (item prioritário no topo da barra de navegação). Ao selecionar um evento (via clique na linha ou botão "Definir como Ativo"), a temporada ativa é configurada no `seasonStore` e a aplicação redireciona automaticamente para `/dashboard`.
- `/dashboard`: Painel analítico de KPIs e métricas da temporada ativa, com atalhos de ação rápida (`+ 🐾` para adicionar cães).
- `/photographers`: Gestão de fotógrafos parceiros e credenciais.
- `/people`: Catálogo unificado de pessoas físicas cadastradas.
- `/clients`: Listagem de clientes da temporada, cães e registros de faturamento.
- `/clients/:id`: Detalhes cadastrais e galeria de fotos adquiridas pelo cliente.
- `/reports`: Extração assíncrona e download de relatórios CSV.
- `/admin/tenants`: Gestão multi-tenant e planos (restrito a `superadmin`).
- `/admin/users`: Administração de usuários e papéis (restrito a `admin` e `superadmin`).

---

## 🛡️ Componente `ProtectedRoute` e `AdminRoute`

A proteção das rotas contra acessos não autorizados é garantida por wrappers declarativos:

```tsx
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

Para áreas restritas a administradores (`/admin/...`), o componente `AdminRoute` verifica se o usuário possui `role === 'admin'` ou `superAdmin === true`. Tentativas de acesso indevido são redirecionadas com notificação visual para o dashboard.

---

## 🔗 Referências Cruzadas
- [Catálogo Canônico](../index.md)
- [Gerenciamento de Estado com Zustand](state-management.md)
- [Componentes UI e Design System](ui-components.md)
- [Autenticação e Segurança em Camadas](../architecture/auth-and-security.md)
- [Subdomínio de Autenticação e Usuários](../domain/auth.md)
