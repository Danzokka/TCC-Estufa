# Guia de Teste do Sistema de Bomba ESP32

## 📋 Configuração Atual

✅ **PumpController ativado** com LED interno (GPIO 2)  
✅ **HTTP Server** rodando na porta 8080  
✅ **WiFi** conectado automaticamente  
✅ **Display OLED** mostrando status da bomba

---

## 🔗 Endpoints HTTP Disponíveis

### Base URL

```
http://[IP_DO_ESP32]:8080
```

### 1. Ativar Bomba por Duração

**POST** `/pump/activate`

```json
{
  "duration": 10
}
```

_Ativa a bomba por 10 segundos_

### 2. Ativar Bomba por Volume

**POST** `/pump/activate`

```json
{
  "volume": 1.5
}
```

_Ativa a bomba para 1.5 litros_

### 3. Ativar Bomba Manual

**POST** `/pump/activate`

```json
{}
```

_Ativa a bomba em modo manual (sem tempo limite)_

### 4. Desativar Bomba

**POST** `/pump/deactivate`

```json
{}
```

### 5. Status da Bomba

**GET** `/pump/status`

### 6. Parada de Emergência

**POST** `/pump/emergency-stop`

```json
{}
```

---

## 🧪 Como Testar

### Opção 1: Via Browser/Postman

1. Conecte-se à mesma rede WiFi do ESP32
2. Abra o Serial Monitor para ver o IP do ESP32
3. Use Postman ou similar para enviar requisições HTTP

### Opção 2: Via cURL (Terminal)

```bash
# Verificar status
curl -X GET http://192.168.1.100:8080/pump/status

# Ativar bomba por 5 segundos
curl -X POST http://192.168.1.100:8080/pump/activate \
  -H "Content-Type: application/json" \
  -d '{"duration": 5}'

# Desativar bomba
curl -X POST http://192.168.1.100:8080/pump/deactivate \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Opção 3: Script de Teste JavaScript

```javascript
const esp32_ip = "192.168.1.100"; // Substitua pelo IP real
const base_url = `http://${esp32_ip}:8080`;

// Função para ativar bomba
async function activatePump(duration) {
  const response = await fetch(`${base_url}/pump/activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ duration: duration }),
  });
  return response.json();
}

// Função para verificar status
async function getPumpStatus() {
  const response = await fetch(`${base_url}/pump/status`);
  return response.json();
}

// Teste completo
async function testPump() {
  console.log("1. Status inicial:", await getPumpStatus());
  console.log("2. Ativando bomba:", await activatePump(10));
  setTimeout(async () => {
    console.log("3. Status durante execução:", await getPumpStatus());
  }, 2000);
}
```

---

## 🔍 O que Observar

### 1. LED Interno (GPIO 2)

- **Ligado**: Bomba ativa
- **Desligado**: Bomba inativa
- **Pisca**: Pode indicar erro ou estado transitório

### 2. Serial Monitor

```
Pump activated for duration: 10 seconds
Relay activated - pump ON
HTTP Server running on: http://192.168.1.100:8080
```

### 3. Display OLED

- **Switch LOW**: Mostra dados dos sensores + status da bomba
- **Switch HIGH**: Mostra informações do ESP32

### 4. Respostas HTTP

**Status Response:**

```json
{
  "status": "on",
  "enabled": true,
  "mode": "duration",
  "runtime_seconds": 5,
  "remaining_seconds": 5,
  "duration_seconds": 10
}
```

**Error Response:**

```json
{
  "error": "Pump already running",
  "status": "error"
}
```

---

## ⚠️ Recursos de Segurança

### 1. Tempo Máximo

- **Limite**: 5 minutos (300 segundos)
- **Proteção**: Parada automática se exceder

### 2. Condições de Segurança

- **WiFi**: Deve estar conectado
- **Status**: Bomba deve estar habilitada

### 3. Parada de Emergência

- **HTTP**: `/pump/emergency-stop`
- **Automática**: Em caso de falha de segurança

---

## 🐛 Resolução de Problemas

### Bomba não ativa

1. Verificar se WiFi está conectado
2. Verificar se bomba está habilitada
3. Verificar se não há operação ativa

### LED não acende

1. Verificar se GPIO 2 está configurado corretamente
2. Verificar se a ativação foi bem-sucedida
3. Verificar logs no Serial Monitor

### HTTP não responde

1. Verificar IP do ESP32
2. Verificar se está na mesma rede
3. Verificar porta 8080
4. Verificar firewall

---

## 📊 Monitoramento

### Logs Importantes

```
Initializing Pump Controller...
HTTP Server started for pump control
HTTP Server running on: http://192.168.1.100:8080
Pump activated for duration: 10 seconds
Relay activated - pump ON
Pump duration completed - auto stopping
Relay deactivated - pump OFF
```

### Estados da Bomba

- **PUMP_OFF**: Inativa
- **PUMP_ON**: Ativa
- **PUMP_ERROR**: Erro (requer reset)

### Modos de Operação

- **MODE_MANUAL**: Manual (sem tempo limite)
- **MODE_DURATION**: Por tempo específico
- **MODE_VOLUME**: Por volume específico

---

## 🚀 Próximos Passos

1. **Testar cada endpoint individualmente**
2. **Verificar comportamento do LED**
3. **Monitorar logs no Serial Monitor**
4. **Testar condições de erro**
5. **Validar parada de emergência**

**Arquivo criado**: `pump-test-guide.md`
