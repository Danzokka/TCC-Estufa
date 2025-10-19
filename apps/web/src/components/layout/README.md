# Componentes de Layout

Esta pasta contém todos os componentes relacionados ao layout da aplicação, incluindo notificações, sidebar, header e outros elementos de interface.

## 📁 Estrutura

```
components/layout/
├── index.ts                        # Exportações principais
├── alerts-badge.tsx               # Badge de alertas principal
├── notification-center.tsx        # Centro de notificações em tempo real
├── irrigation-notification.tsx    # Notificação específica de irrigação
├── notifications.tsx              # Componente de notificações tradicionais
├── app-sidebar.tsx               # Sidebar da aplicação
├── header.tsx                     # Cabeçalho
├── footer.tsx                     # Rodapé
├── nav.tsx                        # Navegação
├── sidebar.tsx                    # Sidebar genérica
├── user-menu.tsx                  # Menu do usuário
├── theme-switcher.tsx             # Alternador de tema
├── logout.tsx                     # Componente de logout
└── README.md                      # Esta documentação
```

## 🔔 Componentes de Notificação

### `AlertsBadge`

Componente principal que agrupa todos os tipos de alertas e notificações.

**Funcionalidades:**

- Notificações em tempo real via WebSocket
- Badge com contador de não lidas
- Alertas tradicionais do sistema
- Integração com hook `useNotifications`

### `NotificationCenter`

Centro de notificações em tempo real com interface moderna.

**Funcionalidades:**

- Conexão WebSocket em tempo real
- Status de conexão visível
- Contador de notificações não lidas
- Ações de marcar como lida
- Interface responsiva

### `IrrigationNotification`

Componente específico para notificações de irrigação (atualmente desabilitado).

### `Notifications`

Componente de notificações tradicionais do sistema.

**Funcionalidades:**

- Notificações do servidor
- Integração com `getNotifications()`
- Interface com `AnimatedList`
- Badge de contagem

## 🎨 Componentes de Interface

### `AppSidebar`

Sidebar principal da aplicação com navegação.

### `Header`

Cabeçalho da aplicação com logo e navegação.

### `Footer`

Rodapé da aplicação.

### `Nav`

Componente de navegação reutilizável.

### `Sidebar`

Sidebar genérica para diferentes contextos.

### `UserMenu`

Menu do usuário com opções de perfil e logout.

### `ThemeSwitcher`

Alternador entre tema claro e escuro.

### `Logout`

Componente para logout do usuário.

## 🔧 Uso

```tsx
// Importação individual
import { AlertsBadge } from "@/components/layout/alerts-badge";
import { NotificationCenter } from "@/components/layout/notification-center";

// Importação múltipla
import { AlertsBadge, NotificationCenter, Header } from "@/components/layout";
```

## 📱 Responsividade

Todos os componentes de notificação são responsivos e se adaptam a diferentes tamanhos de tela:

- **Mobile**: Interface compacta com scroll
- **Tablet**: Layout intermediário
- **Desktop**: Interface completa com sidebar

## 🎯 Integração

Os componentes de notificação se integram com:

- **WebSocket**: Para notificações em tempo real
- **API Backend**: Para persistência de dados
- **Hooks**: `useNotifications` para gerenciamento de estado
- **Context**: Para dados globais da aplicação

## 🚀 Funcionalidades Avançadas

### Notificações em Tempo Real

- Conexão WebSocket automática
- Reconexão em caso de falha
- Sincronização com backend
- Som de notificação

### Persistência

- Notificações salvas no banco de dados
- Status de leitura/não leitura
- Histórico de notificações
- Limpeza automática de notificações antigas

### Interface Moderna

- Design inspirado no iPhone
- Efeito "liquid glass"
- Animações suaves
- Dark mode support
