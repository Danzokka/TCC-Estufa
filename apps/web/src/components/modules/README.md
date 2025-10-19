# Módulos de Componentes

Esta pasta contém módulos específicos de funcionalidades, organizados por domínio de negócio.

## 📁 Estrutura

```
components/modules/
├── notification/              # Módulo de notificações
│   ├── index.ts              # Exportações do módulo
│   ├── notification-item.tsx  # Item individual
│   ├── notifications-list.tsx  # Lista de notificações
│   ├── notifications-header.tsx # Header com ações
│   ├── notifications-container.tsx # Container principal
│   ├── notification-center.tsx # Centro de notificações
│   ├── irrigation-notification.tsx # Notificação de irrigação
│   └── README.md             # Documentação do módulo
└── README.md                  # Esta documentação
```

## 🎯 Princípios da Organização Modular

### 1. **Separação por Domínio**

Cada módulo representa uma funcionalidade específica do sistema:

- `notification/` - Sistema de notificações
- `irrigation/` - Sistema de irrigação (futuro)
- `sensors/` - Sistema de sensores (futuro)
- `plants/` - Sistema de plantas (futuro)

### 2. **Componentes Coesos**

Cada módulo contém apenas componentes relacionados à sua funcionalidade:

- Componentes específicos do domínio
- Hooks relacionados
- Utilitários específicos
- Tipos e interfaces

### 3. **Interface Clara**

Cada módulo expõe uma interface limpa através do `index.ts`:

```typescript
// Exportações principais
export { NotificationCenter } from "./notification-center";
export { NotificationItem } from "./notification-item";

// Tipos
export interface Notification { ... }
```

## 🔧 Vantagens da Organização Modular

### **Manutenibilidade**

- Fácil localizar componentes relacionados
- Mudanças isoladas por domínio
- Reduz acoplamento entre funcionalidades

### **Reutilização**

- Componentes podem ser importados individualmente
- Módulos podem ser reutilizados em diferentes contextos
- Interface clara para integração

### **Escalabilidade**

- Fácil adicionar novos módulos
- Estrutura consistente entre módulos
- Padrões estabelecidos para novos desenvolvedores

### **Testabilidade**

- Componentes isolados são mais fáceis de testar
- Mocks específicos por módulo
- Testes de integração por domínio

## 📦 Uso dos Módulos

### Importação Individual

```typescript
import { NotificationCenter } from "@/components/modules/notification/notification-center";
import { NotificationItem } from "@/components/modules/notification/notification-item";
```

### Importação do Módulo

```typescript
import {
  NotificationCenter,
  NotificationItem,
  type Notification,
} from "@/components/modules/notification";
```

### Importação Múltipla

```typescript
import { NotificationCenter } from "@/components/modules/notification";
import { IrrigationControl } from "@/components/modules/irrigation";
```

## 🚀 Adicionando Novos Módulos

### 1. Criar Estrutura

```bash
mkdir -p apps/web/src/components/modules/meu-modulo
```

### 2. Criar Componentes

```typescript
// meu-modulo/meu-componente.tsx
export function MeuComponente() {
  // Implementação
}
```

### 3. Criar index.ts

```typescript
// meu-modulo/index.ts
export { MeuComponente } from "./meu-componente";
export type { MeuTipo } from "./types";
```

### 4. Documentar

```markdown
# meu-modulo/README.md

## Funcionalidades

## Componentes

## Uso
```

## 🎨 Padrões Estabelecidos

### **Nomenclatura**

- Componentes: `PascalCase`
- Arquivos: `kebab-case`
- Pastas: `kebab-case`

### **Estrutura de Arquivos**

- `index.ts` - Exportações principais
- `README.md` - Documentação do módulo
- Componentes específicos
- Tipos e interfaces

### **Documentação**

- README por módulo
- Comentários JSDoc nos componentes
- Exemplos de uso
- Tipos exportados

## 🔄 Migração de Componentes

Para mover componentes existentes para módulos:

1. **Identificar Domínio**: Qual funcionalidade o componente serve?
2. **Criar Módulo**: Se não existir, criar o módulo
3. **Mover Componentes**: Mover arquivos para o módulo
4. **Atualizar Imports**: Atualizar todas as importações
5. **Testar**: Verificar se tudo funciona
6. **Documentar**: Atualizar documentação

## 📋 Checklist para Novos Módulos

- [ ] Pasta criada com nome descritivo
- [ ] Componentes organizados logicamente
- [ ] `index.ts` com exportações
- [ ] `README.md` com documentação
- [ ] Tipos e interfaces exportados
- [ ] Testes criados
- [ ] Imports atualizados
- [ ] Linting sem erros
