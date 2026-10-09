---
name: ps-workflow
description: >-
  Fluxo padronizado de ciclo de vida de desenvolvimento e entrega de tarefas no PS:
  sincronização obrigatória da branch main, preparação de branch, commits semânticos
  (Conventional Commits), atualização mandatória de documentação canônica (OKF) e docs/log.md,
  validação unificada via scripts, abertura de Pull Request para a branch 'main' e fechamento de issue.
---

# Skill: Fluxo de Trabalho, Versionamento e Entrega — PS

Esta skill estabelece o fluxo de trabalho obrigatório de ponta a ponta para qualquer tarefa, issue ou modificação no projeto **PS (Photo Storage)**.

---

## 🔄 Ciclo de Vida de uma Tarefa

```mermaid
flowchart LR
    A[1. Ler/Mapear Issue] --> B[2. Sincronizar Main Remota]
    B --> C[3. Criar Branch Dedicada]
    C --> D[4. Desenvolver & Testar]
    D --> E[5. Atualizar Docs OKF & docs/log.md]
    E --> F[6. Validar check.sh all]
    F --> G[7. Commit Semântico]
    G --> H[8. Re-sincronizar com Main]
    H --> I[9. Subir PR para Main]
    I --> J[10. Comentar e Fechar Issue]
```

---

## 📋 Protocolo de Execução Passo a Passo

### 1. Início da Tarefa & Sincronização Obrigatória da `main`
- Analise a issue utilizando o GitHub MCP (`get_issue`) ou o contexto da tarefa solicitada.
- > [!IMPORTANT]
  > **Garantia de `main` Atualizada**: É estritamente obrigatório sincronizar a branch `main` com a remota antes de criar qualquer nova branch de trabalho. Nunca crie uma branch a partir de uma `main` defasada.

Execute sempre a rotina de sincronização antes de iniciar:
```bash
# 1. Certifique-se de que a working tree está limpa
git status

# 2. Mude para a branch main e busque as últimas atualizações do repositório remoto
git checkout main
git fetch origin main
git pull origin main --ff-only

# 3. Crie e alterne para a branch dedicada a partir da main atualizada
git checkout -b <tipo>/<nome-da-branch>
```

#### Convenção de Nomes de Branch:
- **Com Issue vinculada**: `<tipo>/<id_da_issue>-<descricao-curta>`
  - `feat/27-async-clients-csv-report`: Novas funcionalidades vinculadas à issue #27.
  - `fix/30-report-phone-format-portuguese-payments`: Correções de bugs vinculadas à issue #30.
- **Sem Issue vinculada (manutenções internas/skills)**: `<tipo>/<descricao-curta>`
  - `chore/enforce-main-sync-workflow`: Ajustes de documentação interna e skills.
  - `docs/readme-update`: Atualizações de documentação.

---

### 2. Desenvolvimento & Testes Locais
- Execute as modificações necessárias seguindo as diretrizes da arquitetura (`ps-dev`) e segurança (`ps-security`).
- Se houver alteração em rotas ou handlers HTTP da API Go, execute obrigatoriamente:
  ```bash
  ./scripts/swagger.sh
  ```

---

### 3. Atualização Mandatória da Documentação Canônica (OKF) & Log Histórico

> [!CAUTION]
> **Zero-Divergence & Trilha de Auditoria Obrigatória**: Todo trabalho — seja nova funcionalidade (`feat`), correção de bug (`fix`), atualização de versões/dependências (`chore`/`deps`/`ci`) ou refatoração (`refactor`) — **DEVE** incluir no mesmo commit/PR:
> 1. A atualização dos documentos canônicos correspondentes sob `docs/`.
> 2. Uma nova entrada datada no histórico cronológico em `docs/log.md`.
>
> **Nenhum PR é considerado completo sem essa etapa.**

#### Matriz de Ação Documental por Tipo de Tarefa:
| Tipo de Tarefa | Documento Canônico a Atualizar | Ação em `docs/logs/AAAA-MM-DD.md` e `docs/log.md` |
| :--- | :--- | :--- |
| **Nova Feature (`feat`)** | `docs/domain/`, `docs/frontend/` e/ou `docs/architecture/` | Seção no arquivo diário do dia com telas/endpoints; bullet no `docs/log.md` |
| **Correção de Bug (`fix`)** | Documento do componente afetado (`docs/architecture/auth-and-security.md`, `docs/domain/...`) | Seção no arquivo diário do dia com causa raiz e mitigação; bullet no `docs/log.md` |
| **Atualização de Versão / Deps (`chore`/`deps`/`ci`)** | `docs/operations/docker-and-local-dev.md`, `docs/operations/ci-cd-pipelines.md`, `docs/index.md` | Seção no arquivo diário do dia com bumps detalhados; bullet no `docs/log.md` |
| **Decisão Estrutural (`refactor`/`arch`)** | Novo ADR em `docs/adrs/` e indexação em `docs/index.md` | Seção no arquivo diário do dia com motivação técnica; bullet no `docs/log.md` |

#### Como Registrar no Log Diário (`docs/logs/AAAA-MM-DD.md`) e Catálogo Central (`docs/log.md`):
1. **No arquivo diário `docs/logs/AAAA-MM-DD.md`**:
   - Se o arquivo do dia já existir, adicione uma nova seção:
     ```markdown
     ## 🎯 <Título Semântico> (#<id_da_issue_ou_pr>)

     ### 📋 Resumo da Alteração
     [Contexto, motivação e impacto das alterações]

     ### 🛠️ Modificações Realizadas
     - **Camada/Módulo**: [Detalhamento técnico das mudanças]
     - **Documentos Canônicos Atualizados**: [docs/caminho/arquivo.md](../caminho/arquivo.md)
     ```
   - Se for o primeiro registro do dia, crie `docs/logs/AAAA-MM-DD.md` com YAML frontmatter (`type: log`, `timestamp: AAAA-MM-DD`, etc.).
2. **No catálogo central `docs/log.md`**:
   - Adicione o bullet point com link para a seção no dia correspondente (ou crie a entrada da data se for o primeiro registro do dia).
   - Atualize `timestamp: AAAA-MM-DD` no frontmatter de `docs/log.md`.

---

### 4. Validação Mandatória de Qualidade

Execute a checagem completa e assegure 100% de aprovação antes de qualquer commit:
```bash
./scripts/check.sh all
```

---

### 5. Commits Semânticos (Conventional Commits)
- Organize os commits de forma atômica seguindo o padrão Conventional Commits:
  - **Com Issue**: `<tipo>(<escopo>): <descrição clara no imperativo> (#<id_da_issue>)`
    - `feat(reports): extração assíncrona de relatório csv com baixo consumo de memória (#27)`
    - `fix(reports): padronizar formatacao de telefone e traduzir formas de pagamento para portugues (#30)`
  - **Sem Issue**: `<tipo>(<escopo>): <descrição clara no imperativo>`
    - `chore(skills): align skills with domain models and real pull requests`

---

### 6. Re-sincronização com `main` e Envio do Pull Request (GitHub MCP)
- Antes de subir a branch ou abrir o PR, garanta que sua branch de trabalho incorpora as atualizações mais recentes da `main`:
  ```bash
  git fetch origin main
  git rebase origin/main
  ```
- Faça o push da branch para o repositório remoto (`git push -u origin <nome-da-branch>`).
- Abra o Pull Request apontando para a base `main` utilizando a ferramenta MCP do GitHub (`create_pull_request`):
  - **Title**: `<tipo>(<escopo>): <título semântico claro>` (com `(#<id_da_issue>)` se houver).
  - **Head**: `<nome-da-sua-branch>`
  - **Base**: `main`
  - **Body**: Deve conter:
    - Resumo detalhado das alterações realizadas.
    - Referência de fechamento se aplicável: `Closes #<id_da_issue>` ou `Resolves #<id_da_issue>`.
    - Checklist de validações executadas:
      - `[✓] Documentação canônica atualizada sob docs/`
      - `[✓] Registro cronológico datado adicionado em docs/log.md`
      - `[✓] ./scripts/check.sh docs (validação OKF aprovada)`
      - `[✓] ./scripts/check.sh all (100% de testes e checagens aprovados)`
      - `[✓] ./scripts/swagger.sh (Swagger atualizado, se aplicável)`

---

### 7. Atualização e Fechamento da Issue (GitHub MCP)
- Se a tarefa estiver vinculada a uma issue:
  - Adicione um comentário na issue utilizando `add_issue_comment` informando a entrega com o link do PR criado.
  - Atualize o status da issue para fechada utilizando `update_issue(state: "closed")` quando o trabalho for entregue.

---

## 🛠️ Matriz de Ferramentas GitHub MCP Utilizadas

| Etapa | Ferramenta MCP GitHub | Finalidade |
| :--- | :--- | :--- |
| **Leitura da Issue** | `get_issue` | Obter descrição, contexto e requisitos da tarefa |
| **Criação do PR** | `create_pull_request` | Abrir PR direcionado à branch `main` |
| **Comentário na Issue**| `add_issue_comment` | Registrar entrega com link do PR |
| **Fechamento da Issue**| `update_issue` | Atualizar estado para `closed` |
