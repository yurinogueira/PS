---
description: Diretrizes mandatórias de integridade e conformidade da documentação canônica (OKF) no PS
globs: "**/*"
---

# 📚 Regras de Documentação Canônica (OKF) — PS

Estas diretrizes são **mandatórias** e devem ser observadas por desenvolvedores e agentes autônomos de IA ao realizar qualquer modificação no projeto **PS (Photo Storage)**.

---

## 🛑 1. Fonte Única da Verdade

- A base de documentação em `docs/` é estruturada segundo a especificação **Open Knowledge Format (OKF)** do Google Cloud e constitui a única fonte canônica da verdade sobre o sistema.
- Antes de iniciar o desenvolvimento ou propor refatorações de código, consulte o catálogo canônico em `docs/index.md` e a especificação de domínio correspondente em `docs/domain/` para evitar alucinações e premissas equivocadas.

---

## 🔄 2. Sincronização Obrigatória de Código e Documentação

- Qualquer alteração de regras de negócio, contratos de API, schemas de banco de dados, fluxos de segurança ou configurações operacionais **DEVE** vir acompanhada da atualização correspondente na documentação canônica no mesmo Pull Request.
- **Proibido Documento Órfão**: Todo novo arquivo `.md` criado em `docs/` deve conter cabeçalho YAML frontmatter com campo `type:` válido e ser indexado em `docs/index.md`.
- **Proibido Link Quebrado**: Todas as referências cruzadas entre documentos devem utilizar Markdown links relativos estritamente válidos.

---

## 🧪 3. Validação Mandatória

- Antes de abrir ou mesclar Pull Requests, execute a verificação automatizada:
  ```bash
  ./scripts/check.sh docs
  ```
- O pipeline `.github/workflows/docs.yml` bloqueará integrações que violem o padrão OKF ou introduzam referências quebradas.
