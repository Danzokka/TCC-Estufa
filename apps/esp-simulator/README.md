# ESP32 Simulator

Simulador do ESP32 para testes do sistema de estufa inteligente sem hardware real.

## Features

- 🌡️ Simula todos os sensores (temperatura, umidade, solo, luz)
- 💧 Responde comandos de pump (igual ao ESP32 real)
- 📤 Envia dados periódicos ao backend
- 🎭 Cenários pré-definidos para testes
- ⏰ Variações realistas baseadas na hora do dia
- 🚿 Umidade do solo aumenta quando pump é ativado

## Instalação

```bash
cd apps/esp-simulator
pip install -r requirements.txt
cp .env.example .env
# Edite .env com o ID da sua greenhouse
```

## Uso

### Iniciar o simulador

```bash
# Básico (sem enviar dados)
python simulator.py --no-send

# Com envio para backend
python simulator.py --greenhouse YOUR_GREENHOUSE_ID

# Com cenário inicial
python simulator.py --greenhouse YOUR_GREENHOUSE_ID --scenario dry

# Porta diferente
python simulator.py --port 8081
```

### Opções

| Argumento      | Descrição              | Default               |
| -------------- | ---------------------- | --------------------- |
| `--port`       | Porta HTTP             | 8080                  |
| `--backend`    | URL do backend         | http://localhost:5000 |
| `--greenhouse` | ID da greenhouse       | (env)                 |
| `--interval`   | Intervalo de envio (s) | 30                    |
| `--no-send`    | Desabilita envio       | false                 |
| `--scenario`   | Cenário inicial        | -                     |

## Endpoints (Compatíveis com ESP32 real)

### Device Status

```bash
GET http://localhost:8080/status
GET http://localhost:8080/sensors
```

### Pump Control

```bash
GET  http://localhost:8080/pump/status
POST http://localhost:8080/pump/activate  {"duration_ms": 500}
POST http://localhost:8080/pump/stop
```

### Simulation Control

```bash
GET  http://localhost:8080/sim/state     # Estado completo
POST http://localhost:8080/sim/reset     # Reset para defaults
POST http://localhost:8080/sim/set       # Setar valores específicos
POST http://localhost:8080/sim/scenario  # Aplicar cenário
```

## Scripts de Controle

```bash
# Ver status completo
python scripts.py status

# Ver sensores
python scripts.py sensors

# Monitorar em tempo real
python scripts.py watch

# Pump
python scripts.py pump-on 2      # Liga por 2 segundos
python scripts.py pump-off       # Desliga

# Setar valores
python scripts.py set soil_moisture 20
python scripts.py dry             # Solo seco (15%)
python scripts.py wet             # Solo úmido (85%)

# Cenários
python scripts.py scenario dry    # Condições secas
python scripts.py scenario hot    # Temperatura alta
python scripts.py scenario optimal # Condições ideais

# Reset
python scripts.py reset
```

## Cenários Disponíveis

| Cenário     | Descrição                           |
| ----------- | ----------------------------------- |
| `dry`       | Solo seco (15%), ar quente          |
| `wet`       | Solo úmido (85%), ar úmido          |
| `hot`       | Temperatura alta (38°C), muita luz  |
| `cold`      | Temperatura baixa (12°C), pouca luz |
| `optimal`   | Condições ideais                    |
| `low_water` | Reservatório baixo                  |
| `night`     | Simulação noturna                   |

## Integração com AI Service

O AI Service pode usar o simulador como se fosse um ESP32 real:

```python
# No AI service
ESP32_IP = "127.0.0.1"  # ou "localhost"
ESP32_PORT = 8080

# Funciona igual ao hardware real!
response = requests.post(f"http://{ESP32_IP}:{ESP32_PORT}/pump/activate",
                         json={"duration_ms": 500})
```

## Lógica de Simulação

### Umidade do Solo

- Diminui naturalmente ~0.05% por minuto
- Aumenta ~2% por segundo de pump ativo

### Temperatura

- Varia baseada na hora do dia
- Pico às 14h, mínima às 5h
- +/- 0.5°C de variação aleatória

### Luz

- 0 durante a noite (19h-6h)
- Pico ao meio-dia (~1000 lux)
- Sunrise/sunset gradual

### Pump

- Duração configurável em ms
- Aumenta umidade proporcionalmente
- Diminui nível do reservatório

## Exemplos de Teste

### Teste de Irrigação Automática

```bash
# Terminal 1: Inicia simulador com solo seco
python simulator.py --greenhouse YOUR_ID --scenario dry

# Terminal 2: Monitora
python scripts.py watch

# Terminal 3: Inicia AI service
cd ../ai
python main.py --mode smart-irrigation

# O AI deve detectar solo seco e ativar a bomba!
```

### Teste de Cenários Extremos

```bash
# Cenário crítico: solo muito seco
python scripts.py set soil_moisture 5

# Cenário: reservatório vazio
python scripts.py set water_level 0

# Reset para normal
python scripts.py scenario optimal
```
