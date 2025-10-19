# Sistema de Irrigação - Guia de Testes

Este guia explica como testar o sistema completo de irrigação com notificações em tempo real.

## 🎯 Funcionalidades Implementadas

### 1. Detecção de Irrigação por Bomba

- **Quando**: Uma bomba é ativada automaticamente
- **Notificação**: "Bomba ativada por X segundos, liberando Y litros de água"
- **Ação**: Notificação informativa (não requer ação do usuário)

### 2. Detecção de Irrigação por Umidade

- **Quando**: Aumento significativo na umidade do solo (>15%) sem ativação de bomba
- **Notificação**: "Detectado aumento de X% na umidade do solo"
- **Ação**: Redireciona para formulário de confirmação

### 3. Formulário de Confirmação

- **Acesso**: `/dashboard/irrigation/confirm/[id]`
- **Opções**: Irrigação manual ou chuva natural
- **Campos**: Quantidade de água (se manual), observações
- **Resultado**: Notificação de confirmação

## 🧪 Como Testar

### Pré-requisitos

1. Backend rodando em `http://localhost:3001`
2. Frontend rodando em `http://localhost:3000`
3. Banco de dados PostgreSQL configurado
4. Usuário de teste criado

### Teste 1: Script Automatizado

```bash
# Navegar para o diretório da API
cd apps/api

# Instalar dependências (se necessário)
pnpm install

# Executar teste completo
node scripts/test-irrigation-complete.js
```

### Teste 2: Teste Manual via Frontend

#### 2.1 Acessar o Dashboard

1. Abra `http://localhost:3000/dashboard`
2. Faça login com suas credenciais
3. Verifique se o ícone de notificações aparece no header

#### 2.2 Simular Irrigação por Bomba

1. Use o script de teste ou simule via API
2. Verifique se a notificação aparece no canto superior direito
3. Clique na notificação para ver detalhes

#### 2.3 Simular Irrigação por Umidade

1. Use o script de teste ou simule via API
2. Verifique se a notificação aparece com botão "Confirmar Irrigação"
3. Clique no botão para ser redirecionado ao formulário

#### 2.4 Testar Formulário de Confirmação

1. Acesse `/dashboard/irrigation/confirm/[id]` (substitua [id] por um ID válido)
2. Preencha o formulário:
   - **Tipo**: Escolha entre "Irrigação Manual" ou "Chuva Natural"
   - **Quantidade**: Se manual, informe a quantidade de água
   - **Observações**: Adicione observações opcionais
3. Clique em "Confirmar Irrigação"
4. Verifique se a notificação de confirmação aparece

## 🔧 Configuração de Teste

### Variáveis de Ambiente

```bash
# Backend
API_BASE_URL=http://localhost:3001
DATABASE_URL=postgresql://user:password@localhost:5432/estufa_db

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Dados de Teste

```javascript
// Usuário de teste
{
  email: 'admin@example.com',
  password: 'password123'
}

// Estufa de teste
{
  name: 'Estufa Teste Irrigação',
  description: 'Estufa para testes de sistema de irrigação',
  location: 'Laboratório de Testes'
}
```

## 📊 Endpoints da API

### Detecção de Irrigação

```http
POST /irrigation/detect-pump/:pumpOperationId
POST /irrigation/detect-moisture/:greenhouseId/:sensorReadingId
```

### Confirmação de Irrigação

```http
PUT /irrigation/confirm
Content-Type: application/json

{
  "irrigationId": "uuid",
  "waterAmount": 3.0,
  "notes": "Irrigação manual confirmada"
}
```

### Histórico de Irrigação

```http
GET /irrigation/history/:greenhouseId
```

## 🔔 Sistema de Notificações

### WebSocket Events

- `notification`: Notificação geral
- `pump-activated`: Bomba ativada
- `irrigation-detected`: Irrigação detectada
- `irrigation-confirmed`: Irrigação confirmada

### Notificações do Navegador

- Solicita permissão automaticamente
- Mostra notificações mesmo com a aba fechada
- Ícone personalizado do sistema

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. WebSocket não conecta

- Verifique se o token de autenticação está válido
- Confirme se o backend está rodando na porta correta
- Verifique as configurações de CORS

#### 2. Notificações não aparecem

- Verifique se o WebSocket está conectado
- Confirme se as permissões de notificação estão habilitadas
- Verifique o console do navegador para erros

#### 3. Formulário não carrega

- Verifique se o ID da irrigação é válido
- Confirme se a irrigação existe no banco de dados
- Verifique se o usuário tem permissão para acessar

### Logs Úteis

```bash
# Backend logs
tail -f apps/api/logs/application-*.log

# Frontend logs
# Abra o DevTools do navegador (F12) e vá para Console
```

## 📈 Métricas de Sucesso

### Testes Automatizados

- ✅ Conexão WebSocket estabelecida
- ✅ Notificações de bomba recebidas
- ✅ Notificações de umidade recebidas
- ✅ Notificações de confirmação recebidas

### Testes Manuais

- ✅ Interface responsiva
- ✅ Formulário funcional
- ✅ Redirecionamentos corretos
- ✅ Notificações do navegador funcionando

## 🚀 Próximos Passos

1. **Testes de Carga**: Simular múltiplas notificações simultâneas
2. **Testes de Conectividade**: Testar com conexão instável
3. **Testes de Segurança**: Verificar autenticação e autorização
4. **Testes de Performance**: Medir latência das notificações

## 📞 Suporte

Para problemas ou dúvidas:

1. Verifique os logs do sistema
2. Consulte a documentação da API
3. Teste com dados de exemplo
4. Verifique a configuração do banco de dados
