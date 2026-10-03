---
type: runbook
title: "Runbook: Backup e Restauração de Banco de Dados — PS"
description: "Procedimentos operacionais de dump, restore e política de retenção de dados do MongoDB."
tags:
  - operations
  - runbook
  - backup
  - restore
  - mongodb
  - database
timestamp: 2026-10-02
---

# 💾 Runbook: Backup e Restauração de Banco de Dados — PS

Este runbook documenta os procedimentos de segurança para geração de cópias de segurança (backup) e restauração (restore) dos dados persistidos no **MongoDB** do **PS (Photo Storage)**.

Para navegação geral, retorne ao [Catálogo Canônico](../../index.md).

---

## 📦 1. Backup Local (Desenvolvimento & Testes)

Para extrair um dump completo do banco rodando no Docker Compose:

```bash
# 1. Criar pasta de destino
mkdir -p ./backups/$(date +%Y%m%d_%H%M%S)

# 2. Executar mongodump diretamente no container do MongoDB
docker compose exec -T mongo mongodump \
  --db ps \
  --archive --gzip > ./backups/$(date +%Y%m%d_%H%M%S)/ps_backup.gz
```

---

## ☁️ 2. Backup em Produção (MongoDB Atlas)

1. **Snapshots Contínuos**: O cluster gerenciado do MongoDB Atlas é configurado para reter snapshots automáticos a cada 6 horas com retenção mínima de 7 dias (conforme `terraform/mongodb.tf`).
2. **Exportação Manual Sob Demanda (On-Demand)**:
   ```bash
   mongodump \
     --uri="mongodb+srv://ps_app:<SENHA>@ps-cluster.xxxx.mongodb.net/ps" \
     --archive="ps_prod_backup_$(date +%Y%m%d).gz" \
     --gzip
   ```

---

## 🔄 3. Procedimento de Restauração (Restore)

> [!CAUTION]
> **Restauração Sobrescreve Coleções**: O parâmetro `--drop` remove coleções existentes antes de restaurar. Execute este procedimento exclusivamente em janelas de manutenção autorizadas ou ambientes de staging/recuperação.

```bash
# Restaurar arquivo gzipped no banco local:
docker compose exec -T mongo mongorestore \
  --db ps \
  --drop \
  --archive --gzip < ./backups/caminho/ps_backup.gz

# Restaurar no cluster Atlas:
mongorestore \
  --uri="mongodb+srv://ps_app:<SENHA>@ps-cluster.xxxx.mongodb.net/ps" \
  --drop \
  --archive="ps_prod_backup.gz" \
  --gzip
```

---

## 🔗 Referências Cruzadas
- [Catálogo Canônico](../../index.md)
- [Multi-tenancy e Isolamento de Dados](../../architecture/multitenancy-and-data.md)
- [Deploy e Topologia de Nuvem](../deploy-and-infrastructure.md)
- [Runbook: Disaster Recovery](disaster-recovery.md)
