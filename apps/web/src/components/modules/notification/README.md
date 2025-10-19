# Módulo de Notificação

Sistema completo de notificações em tempo real para a aplicação TCC-Estufa.

## 📁 Estrutura do Módulo

```
modules/notification/
├── index.ts                     # Exportações principais
├── notifications.tsx            # Tudo em um arquivo (estilo shadcn/ui)
│   ├── NotificationItemIcon     # Ícone da notificação
│   ├── NotificationItem         # Item individual
│   ├── NotificationHeader       # Cabeçalho da lista
│   ├── NotificationContainer    # Container da lista
│   ├── Notifications           # Componente principal
│   ├── NotificationCenter       # Centro de notificações
│   └── AlertsBadge             # Badge de alertas
└── README.md                    # Esta documentação
```

## 🧩 Componentes do Módulo

### **Componentes Internos** (não exportados)

#### `NotificationItemIcon`

Ícone da notificação com cor baseada no tipo.

#### `NotificationItem`

Item individual da notificação com título, mensagem, tempo e ações.

#### `NotificationHeader`

Cabeçalho da lista com título e botão "marcar todas como lida".

#### `NotificationContainer`

Container da lista com scroll e gradient overlay.

### **Componentes Principais** (exportados)

#### `Notifications`

Componente principal que renderiza a lista completa de notificações.

**Props:**

- `notifications: Notification[]` - Array de notificações
- `unreadCount: number` - Número de notificações não lidas
- `onNotificationClick?: (notification: Notification) => void` - Callback ao clicar
- `onMarkAsRead?: (id: string) => void` - Callback marcar como lida
- `onMarkAllAsRead?: () => void` - Callback marcar todas como lidas
- `className?: string` - Classes CSS adicionais

#### `NotificationCenter`

Centro de notificações completo com interface moderna.

**Funcionalidades:**

- Conexão WebSocket em tempo real
- Status de conexão visível
- Contador de notificações não lidas
- Ações de marcar como lida
- Interface responsiva
- Footer com ações

#### `AlertsBadge`

Badge de alertas com popover de notificações.

**Funcionalidades:**

- Badge com contador de não lidas
- Popover com lista de notificações
- Redirecionamento baseado no tipo
- Status de conexão WebSocket

### **Tipos de Notificação:**

- `pump_activated` - Bomba ativada (💧 azul)
- `irrigation_detected` - Irrigação detectada (⚠️ amarelo)
- `irrigation_confirmed` - Irrigação confirmada (✅ verde)
- `system_alert` - Alerta do sistema (🚨 vermelho)
- `maintenance` - Manutenção (🔧 roxo)

## 🎨 Design e Estilo

### **Visual iPhone-like**

- Cards com bordas arredondadas (`rounded-xl`)
- Sombras suaves (`shadow-sm hover:shadow-md`)
- Ícones coloridos em containers arredondados
- Títulos em maiúscula com tracking
- Tempo relativo à direita

### **Estados Visuais**

- **Não lida**: Fundo azul claro, borda azul, ponto azul
- **Lida**: Fundo padrão, sem indicadores
- **Hover**: Fundo cinza claro, sombra aumentada

### **Responsividade**

- Largura fixa de 500px
- Altura máxima de 600px
- Scroll interno quando necessário
- Adaptação para dark mode

## 🔧 Integração

### **Hook useNotifications**

```typescript
import { useNotifications } from "@/hooks/useNotifications";

const {
  notifications,
  unreadCount,
  isConnected,
  markNotificationAsRead,
  markAllAsRead,
  loadNotifications,
} = useNotifications();
```

### **WebSocket em Tempo Real**

- Conexão automática
- Reconexão em caso de falha
- Sincronização com backend
- Som de notificação

### **Persistência**

- Notificações salvas no banco
- Status de leitura persistente
- Histórico completo
- Limpeza automática

## 📱 Uso Prático

### **Centro de Notificações**

```tsx
import { NotificationCenter } from "@/components/modules/notification";

function Header() {
  return (
    <div className="flex items-center gap-2">
      <NotificationCenter />
    </div>
  );
}
```

### **Container Personalizado**

```tsx
import { NotificationsContainer } from "@/components/modules/notification";

function MyNotifications() {
  return (
    <NotificationsContainer
      notifications={notifications}
      unreadCount={unreadCount}
      onNotificationClick={handleClick}
      onMarkAsRead={handleMarkAsRead}
      onMarkAllAsRead={handleMarkAllAsRead}
    />
  );
}
```

### **Item Individual**

```tsx
import { NotificationItem } from "@/components/modules/notification";

function CustomNotification({ notification }) {
  return (
    <NotificationItem
      {...notification}
      onClick={() => console.log("Clicked")}
      onMarkAsRead={(id) => markAsRead(id)}
    />
  );
}
```

## 🚀 Funcionalidades Avançadas

### **Notificações em Tempo Real**

- WebSocket para atualizações instantâneas
- Som de notificação para cada nova notificação
- Badge com contador em tempo real
- Status de conexão visível

### **Gerenciamento de Estado**

- Estado local para performance
- Sincronização com backend
- Cache inteligente
- Persistência automática

### **Interface Moderna**

- Design inspirado no iPhone
- Animações suaves
- Dark mode completo
- Acessibilidade

## 🧪 Testes

### **Testes de Componente**

```typescript
import { render, screen } from '@testing-library/react';
import { NotificationItem } from './notification-item';

test('renders notification item', () => {
  render(<NotificationItem {...mockNotification} />);
  expect(screen.getByText('Test Notification')).toBeInTheDocument();
});
```

### **Testes de Integração**

```typescript
import { NotificationCenter } from './notification-center';

test('shows unread count', () => {
  render(<NotificationCenter />);
  expect(screen.getByText('5')).toBeInTheDocument();
});
```

## 📊 Métricas e Monitoramento

### **Métricas de Performance**

- Tempo de renderização
- Uso de memória
- Frequência de atualizações

### **Métricas de UX**

- Taxa de cliques em notificações
- Tempo para marcar como lida
- Frequência de uso do centro

## 🔄 Manutenção

### **Atualizações Regulares**

- Limpeza de notificações antigas
- Otimização de performance
- Atualização de dependências

### **Debugging**

- Logs de WebSocket
- Estado de notificações
- Erros de sincronização

## 📈 Roadmap

### **Próximas Funcionalidades**

- [ ] Notificações push
- [ ] Categorização avançada
- [ ] Filtros e busca
- [ ] Notificações agendadas
- [ ] Integração com email/SMS
