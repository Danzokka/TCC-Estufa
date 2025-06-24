# Biblioteca para Sensor de Fluxo de Água YF-S201

Esta biblioteca foi desenvolvida para facilitar a leitura de sensores de fluxo de água YF-S201 em projetos com ESP32.

## Características do sensor YF-S201:

- Tensão de operação: 5-18V DC
- Corrente máxima: 15mA (5V)
- Faixa de fluxo: 1-30L/min
- Pressão máxima de trabalho: 2.0MPa
- Precisão: ±10%
- Saída: Pulso (NPN Coletor Aberto)
- Fator de calibração: aproximadamente 7.5 pulsos por segundo por litro/minuto

## Conexão:

- Fio Vermelho: VCC (5V)
- Fio Preto: GND
- Fio Amarelo: Sinal (conectar a um pino digital compatível com interrupções)

## Funções:

- `bool begin()`: Inicializa o sensor e configura interrupções
- `void read()`: Atualiza as leituras do sensor (deve ser chamada regularmente)
- `void resetTotalVolume()`: Reseta o contador de volume total

## Variáveis públicas:

- `float flowRate`: Taxa de fluxo em litros por minuto (L/min)
- `float totalVolume`: Volume total acumulado em litros desde o último reset
