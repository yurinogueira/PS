#!/usr/bin/env bash
set -eo pipefail

# Root directory of PS project
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCS_DIR="$PROJECT_ROOT/docs"

if [ ! -d "$DOCS_DIR" ]; then
  echo "❌ [Docs] Diretório 'docs/' não encontrado em $DOCS_DIR"
  exit 1
fi

ALLOWED_TYPES="index|log|architecture|domain|frontend|operations|adr|runbook|concept"

ERRORS=0
FILE_COUNT=0
LINK_COUNT=0

log_error() {
  local file="$1"
  local msg="$2"
  echo "❌ [Docs] $(realpath --relative-to="$PROJECT_ROOT" "$file"): $msg"
  ERRORS=$((ERRORS + 1))
}

# 1. Validar Frontmatter e Metadados de cada arquivo .md
while IFS= read -r file; do
  FILE_COUNT=$((FILE_COUNT + 1))

  # Linha 1 deve ser ---
  first_line=$(head -n 1 "$file" || true)
  if [ "$first_line" != "---" ]; then
    log_error "$file" "Frontmatter ausente ou não inicia com '---' na linha 1"
    continue
  fi

  # Deve existir um segundo --- fechando o frontmatter
  closing_line=$(awk 'NR>1 && /^---$/ { print NR; exit }' "$file")
  if [ -z "$closing_line" ]; then
    log_error "$file" "Frontmatter não possui delimitador de fechamento '---'"
    continue
  fi

  # Extrair bloco frontmatter
  frontmatter=$(sed -n "2,$((closing_line - 1))p" "$file")

  # Extrair type
  doc_type=$(echo "$frontmatter" | grep -E '^type:' | head -n 1 | awk '{print $2}' | tr -d '"' | tr -d "'" || true)
  if [ -z "$doc_type" ]; then
    log_error "$file" "Campo obrigatório 'type:' ausente no frontmatter"
  elif ! echo "$doc_type" | grep -Eq "^($ALLOWED_TYPES)$"; then
    log_error "$file" "Tipo '$doc_type' inválido. Tipos permitidos: $ALLOWED_TYPES"
  fi

  # Extrair title
  if ! echo "$frontmatter" | grep -Eq '^title:'; then
    log_error "$file" "Campo obrigatório 'title:' ausente no frontmatter"
  fi

  # Extrair description
  if ! echo "$frontmatter" | grep -Eq '^description:'; then
    log_error "$file" "Campo obrigatório 'description:' ausente no frontmatter"
  fi

  # 2. Validar Links Markdown locais no arquivo
  dir_name=$(dirname "$file")
  
  # Extrair alvos dos links no formato [label](target)
  # Ignora links http://, https://, mailto:, e âncoras puras #
  while IFS= read -r link_target; do
    [ -z "$link_target" ] && continue

    # Remover eventual âncora (#...)
    clean_target="${link_target%%#*}"
    [ -z "$clean_target" ] && continue

    LINK_COUNT=$((LINK_COUNT + 1))

    # Resolver caminho absoluto
    if [[ "$clean_target" = /* ]]; then
      resolved="$PROJECT_ROOT$clean_target"
    else
      resolved="$dir_name/$clean_target"
    fi

    # Normalizar caminho
    resolved_normalized=$(cd "$dir_name" && realpath -m "$clean_target" 2>/dev/null || true)

    if [ ! -f "$resolved_normalized" ]; then
      log_error "$file" "Link quebrado para '$link_target' (resolvido: '$resolved_normalized')"
    fi
  done < <(grep -o -E '\[[^]]+\]\(([^)]+)\)' "$file" | sed -E 's/.*\]\(([^)]+)\)/\1/' | grep -v -E '^(https?://|mailto:|#)' || true)

done < <(find "$DOCS_DIR" -type f -name "*.md" | sort)

# 3. Validar se todos os documentos de docs/ estão indexados em docs/index.md
INDEX_FILE="$DOCS_DIR/index.md"
if [ ! -f "$INDEX_FILE" ]; then
  log_error "$DOCS_DIR" "Catálogo central 'docs/index.md' não encontrado"
else
  while IFS= read -r file; do
    # Ignorar index.md e log.md da exigência de auto-indexação
    rel_path=$(realpath --relative-to="$DOCS_DIR" "$file")
    if [ "$rel_path" = "index.md" ] || [ "$rel_path" = "log.md" ]; then
      continue
    fi

    if ! grep -Fq "$rel_path" "$INDEX_FILE"; then
      log_error "$file" "Documento não está referenciado no catálogo central 'docs/index.md'"
    fi
  done < <(find "$DOCS_DIR" -type f -name "*.md" | sort)
fi

if [ $ERRORS -ne 0 ]; then
  echo "❌ [Docs] Falha na validação da documentação: $ERRORS erro(s) encontrado(s)."
  exit 1
fi

echo "✓ [Docs] OK ($FILE_COUNT arquivos e $LINK_COUNT links locais validados com sucesso)"
exit 0
