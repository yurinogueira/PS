---
type: domain
title: "Subdomínio: Identidade, Usuários e Autenticação (Auth)"
description: "Modelos de credenciais, papéis de acesso (RBAC), tokens criptográficos, verificação de e-mail e recuperação de senha."
tags:
  - domain
  - auth
  - user
  - rbac
  - credentials
  - tokens
resource: backend/internal/domain/user
timestamp: 2026-10-02
---

# 🔐 Subdomínio: Identidade, Usuários e Autenticação (Auth)

O subdomínio de **Auth & Usuários** gerencia o ciclo de vida das credenciais, segregação de permissões via RBAC e verificação de contas no **PS (Photo Storage)**.

Para navegação geral, retorne ao [Catálogo Canônico](../index.md).

---

## 🧩 Modelo de Domínio (`User` & `Role`)

Estruturado em `backend/internal/domain/user/user.go`:

```go
type Role string

const (
    RoleAdmin   Role = "admin"
    RoleManager Role = "manager"
    RoleUser    Role = "user"
)

type User struct {
    ID                         string     `json:"id"`
    Name                       string     `json:"name"`
    Email                      string     `json:"email"`
    PasswordHash               string     `json:"-"`
    EmailVerified              bool       `json:"emailVerified"`
    EmailVerifiedAt            *time.Time `json:"emailVerifiedAt,omitempty"`
    EmailVerificationTokenHash string     `json:"-"`
    EmailVerificationExpiresAt *time.Time `json:"-"`
    PasswordResetTokenHash     string     `json:"-"`
    PasswordResetExpiresAt     *time.Time `json:"-"`
    TenantID                   string     `json:"tenantId"`
    SuperAdmin                 bool       `json:"superAdmin"`
    Role                       Role       `json:"role"`
    CreatedAt                  time.Time  `json:"createdAt"`
    UpdatedAt                  time.Time  `json:"updatedAt,omitempty"`
}
```

---

## 📋 Regras de Negócio e Segurança

### 1. Papéis de Acesso e Permissões (RBAC)
- **`SuperAdmin`**: Flag booleana (`SuperAdmin: true`) que concede controle trans-tenant na plataforma para suporte técnico e auditoria global.
- **`admin`**: Proprietário/administrador da organização; gerencia fotógrafos, configurações do tenant, integrações de pagamento e dados de faturamento.
- **`manager`**: Gerente operacional; visualiza e administra clientes, temporadas e registros fotográficos do tenant.
- **`user`**: Fotógrafo ou visualizador restrito; opera nos eventos em que foi explicitamente escalado.

### 2. Armazenamento Seguro de Credenciais
- **Senhas**: Nunca são armazenadas em texto plano. O hashing é efetuado via `bcrypt` com custo mínimo 10 (`DefaultCost`).
- **Omissão em Serialização**: Campos críticos (`PasswordHash`, `EmailVerificationTokenHash`, `PasswordResetTokenHash`) são marcados com `json:"-"` para prevenir qualquer vazamento acidental em serializações JSON.

### 3. Verificação de E-mail e Recuperação de Senha
- Tokens são gerados utilizando geradores de números pseudoaleatórios criptograficamente seguros (`crypto/rand`).
- No banco de dados, armazena-se apenas o **hash** do token (`SHA-256`), mitigando o risco caso ocorra vazamento de backup de banco de dados.
- Tokens possuem tempo de expiração curto (24 horas para verificação de e-mail e 1 hora para recuperação de senha).

---

## 🔗 Referências Cruzadas
- [Catálogo Canônico](../index.md)
- [Autenticação e Segurança em Camadas](../architecture/auth-and-security.md)
- [Subdomínio de Inquilinos (Tenant)](tenant.md)
- [Subdomínio de Trilha de Auditoria](auditlog.md)
- [Roteamento e RBAC no Frontend](../frontend/routing-and-rbac.md)
