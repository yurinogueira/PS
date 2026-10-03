---
type: adr
title: "ADR 0002: Autenticação via Cookies HttpOnly e Sessões Desacopladas"
description: "Decisão de abandonar tokens JWT em LocalStorage e adotar cookies HttpOnly com SameSite Lax."
tags:
  - adr
  - security
  - auth
  - cookies
  - owasp
  - xss
timestamp: 2026-10-02
---

# 📜 ADR 0002: Autenticação via Cookies HttpOnly e Sessões Desacopladas

- **Status**: Aceito
- **Data**: 2026-10-02
- **Decisores**: Equipe de Engenharia PS

Para navegação geral, retorne ao [Catálogo Canônico](../index.md).

---

## 📌 Contexto
Armazenar tokens JWT de acesso e atualização no `localStorage` ou `sessionStorage` do navegador é uma prática vulnerável: qualquer falha de Cross-Site Scripting (XSS) introduzida em dependências terceiras (npm) permite que scripts maliciosos extraiam os tokens do usuário e assumam o controle da conta.

---

## 💡 Decisão
Decidimos que o **PS (Photo Storage)** não expõe mais tokens de sessão no corpo de respostas JSON nem permite que o frontend acesse credenciais:

1. Os tokens `ps_access_token` (15 minutos) e `ps_refresh_token` (7 dias) são gravados exclusivamente via cabeçalho `Set-Cookie` com flags `HttpOnly`, `Secure` e `SameSite=Lax`.
2. O domínio do cookie é configurado para compartilhar credenciais de forma segura entre a SPA (`ps.yurinogueira.dev.br`) e a API (`api-ps.yurinogueira.dev.br`).
3. O cliente Axios do frontend é configurado globalmente com `withCredentials: true`.
4. As stores de frontend mantêm apenas dados públicos de perfil (`name`, `email`, `role`).

---

## ⚖️ Consequências

### Positivas:
- **Imunidade a Roubo por XSS**: Mesmo que um invasor execute JavaScript arbitrário na aplicação cliente, o navegador recusa o acesso aos cookies `HttpOnly`.
- **Experiência Transparente**: O navegador cuida da transmissão dos cookies sem necessidade de interceptors complexos de token no frontend.

### Negativas / Desafios:
- Requer gerenciamento cuidadoso de CORS com `Access-Control-Allow-Credentials: true` e proíbe o uso de wildcard `*` em origens permitidas.
- Testes locais exigem configuração adequada de proxies ou portas compartilhadas para respeitar restrições de cookies entre origens.

---

## 🔗 Referências Cruzadas
- [Catálogo Canônico](../index.md)
- [Autenticação e Segurança em Camadas](../architecture/auth-and-security.md)
- [Subdomínio de Autenticação](../domain/auth.md)
- [Gerenciamento de Estado no Frontend](../frontend/state-management.md)
