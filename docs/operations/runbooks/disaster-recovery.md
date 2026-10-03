---
type: runbook
title: "Runbook: Recuperação de Desastres (Disaster Recovery) — PS"
description: "Procedimentos passo a passo para contingência, restauração de nós da OCI e failover de DNS."
tags:
  - operations
  - runbook
  - disaster-recovery
  - incident
  - oci
  - failover
timestamp: 2026-10-02
---

# 🚨 Runbook: Recuperação de Desastres (Disaster Recovery) — PS

Este runbook descreve as ações emergenciais para restabelecer a operação do **PS (Photo Storage)** em caso de falha catastrófica da infraestrutura em nuvem ou indisponibilidade crítica.

Para navegação geral, retorne ao [Catálogo Canônico](../../index.md).

---

## 🎯 1. Falha Total da Instância OCI Compute

Se a máquina virtual hospedeira do backend ficar inoperante ou for corrompida:

### Passo 1: Reprovisionamento da Instância via Terraform
```bash
cd terraform
# 1. Marcar a instância para substituição
terraform taint oci_core_instance.backend_instance

# 2. Re-aplicar o plano de infraestrutura
terraform apply -target=oci_core_instance.backend_instance -auto-approve
```

### Passo 2: Verificação do Bootstrapping Cloud-Init
Acesse a nova instância via SSH e acompanhe a conclusão do script de provisionamento:
```bash
ssh -i ~/.ssh/id_rsa ubuntu@<IP_RESERVADO>
sudo tail -f /var/log/cloud-init-output.log
```

### Passo 3: Restauração do Binário e Configurações
1. Copie o arquivo `/etc/ps/backend.env` a partir do cofre de segredos ou backup seguro.
2. Baixe o artefato do último build estável do GitHub Actions (`backend-dist`).
3. Inicie e ative o serviço systemd:
   ```bash
   sudo systemctl enable --now ps-backend
   sudo systemctl status ps-backend
   ```

---

## 🔌 2. Indisponibilidade de Conexão com MongoDB Atlas

Se o backend apresentar erros contínuos de timeout no driver de banco (`context deadline exceeded`):

1. **Checar Status do Provedor**: Verifique [MongoDB Cloud Status](https://status.mongodb.com/).
2. **Checar IP Access List**: Confirme se o IP público permanente da nova instância OCI está autorizado na Network Access List do MongoDB Atlas (gerenciado em `terraform/mongodb.tf`).
3. **Validar Resolução DNS**: Na máquina do backend, confirme a resolução do cluster SRV:
   ```bash
   nslookup -type=SRV _mongodb._tcp.ps-cluster.xxxx.mongodb.net
   ```

---

## 🔗 Referências Cruzadas
- [Catálogo Canônico](../../index.md)
- [Deploy e Topologia de Nuvem](../deploy-and-infrastructure.md)
- [Runbook: Backup e Restauração de Banco de Dados](database-backup.md)
- [Runbook: Release e Rollback](release-and-rollback.md)
