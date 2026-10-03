---
type: adr
title: "ADR 0001: Adoção de Clean Architecture e DDD no Backend Go"
description: "Decisão de estruturar o backend Go em camadas concêntricas (Clean Architecture) com princípios de Domain-Driven Design."
tags:
  - adr
  - architecture
  - go
  - clean-architecture
  - ddd
timestamp: 2026-10-02
---

# 📜 ADR 0001: Adoção de Clean Architecture e DDD no Backend Go

- **Status**: Aceito
- **Data**: 2026-10-02
- **Decisores**: Equipe de Engenharia PS

Para navegação geral, retorne ao [Catálogo Canônico](../index.md).

---

## 📌 Contexto
O **PS (Photo Storage)** começou como uma API REST para gestão de fotografias esportivas e eventos. Com o crescimento da complexidade de regras de negócio (limites de plano, isolamento multi-tenant, extrações assíncronas de relatórios e múltiplos métodos de pagamento), manter as regras acopladas diretamente a frameworks web e coleções de banco de dados gerava alto risco de regressões e dificuldades de teste.

---

## 💡 Decisão
Decidimos adotar a **Clean Architecture** (Robert C. Martin) combinada com princípios táticos de **Domain-Driven Design (DDD)**:

1. A camada central `internal/domain/` contém entidades puras e regras invariantes sem qualquer importação de frameworks ou drivers externos.
2. A camada `internal/application/ports/` define os contratos de abstração (interfaces de repositórios e serviços).
3. A camada `internal/application/usecase/` orquestra os fluxos de trabalho do sistema consumindo apenas interfaces.
4. Frameworks HTTP (`net/http`, routers) e drivers de banco (`go.mongodb.org/mongo-driver`) residem exclusivamente nas camadas periféricas (`interfaces/rest` e `infrastructure`).

---

## ⚖️ Consequências

### Positivas:
- **Testabilidade Superior**: Use cases podem ser testados unitariamente de forma isolada com mocks em milissegundos sem depender de instâncias reais de MongoDB.
- **Independência de Provedores**: O provedor de storage ou banco de dados pode ser substituído ou evoluído sem alterar nenhuma linha de regra de negócio.
- **Clareza de Limites**: Desenvolvedores e agentes de IA têm limites óbvios para cada tipo de modificação.

### Negativas / Desafios:
- Maior número inicial de arquivos e interfaces (DTOs, Mappers, Ports).
- Curva de aprendizado para novos colaboradores não familiarizados com a inversão de dependência.

---

## 🔗 Referências Cruzadas
- [Catálogo Canônico](../index.md)
- [Visão Geral da Arquitetura](../architecture/overview.md)
- [Multi-tenancy e Isolamento de Dados](../architecture/multitenancy-and-data.md)
