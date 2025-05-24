#include "FLOW_SENSOR.h"

// Inicialização da variável estática
FLOW_SENSOR *FLOW_SENSOR::_instance = nullptr;

// Cria uma instância global do sensor
FLOW_SENSOR flow_sensor; // Usa o pino padrão definido no .h

// Construtor
FLOW_SENSOR::FLOW_SENSOR(int pin)
{
    _pin = pin;
    flowRate = 0.0;
    totalVolume = 0.0;
    literSeconds = 0.0;
    _pulseCount = 0;
    _lastReadTime = 0;
    _readMode = FLOW_MODE_INTERRUPT; // Usa interrupção por padrão
}

// Define o modo de leitura
void FLOW_SENSOR::setReadMode(uint8_t mode)
{
    if (mode == FLOW_MODE_INTERRUPT || mode == FLOW_MODE_PULSEIN)
    {
        // Se estiver mudando de interrupção para pulseIn, desativa a interrupção
        if (_readMode == FLOW_MODE_INTERRUPT && mode == FLOW_MODE_PULSEIN)
        {
            detachInterrupt(digitalPinToInterrupt(_pin));
        }
        // Se estiver mudando de pulseIn para interrupção, configura a interrupção
        else if (_readMode == FLOW_MODE_PULSEIN && mode == FLOW_MODE_INTERRUPT)
        {
            _instance = this;
            attachInterrupt(digitalPinToInterrupt(_pin), pulseCounter, FALLING);
        }

        _readMode = mode;
        Serial.print("Modo de leitura do sensor de fluxo alterado para: ");
        Serial.println(_readMode == FLOW_MODE_INTERRUPT ? "Interrupção" : "PulseIn");
    }
}

// Função de inicialização
bool FLOW_SENSOR::begin()
{
    if (_pin <= 0)
    {
        Serial.println(F("Flow sensor pin not configured"));
        return false;
    }

    // Configura o pino como entrada com pull-up
    pinMode(_pin, INPUT_PULLUP);

    // Inicializa com base no modo selecionado
    if (_readMode == FLOW_MODE_INTERRUPT)
    {
        // Salva a instância para uso na função de callback
        _instance = this;

        // Configura a interrupção para contagem de pulsos
        attachInterrupt(digitalPinToInterrupt(_pin), pulseCounter, FALLING);

        Serial.println(F("Sensor de fluxo inicializado no modo de interrupção"));
    }
    else
    {
        Serial.println(F("Sensor de fluxo inicializado no modo pulseIn"));
    }

    _lastReadTime = millis();
    return true;
}

// Função para ler o sensor
void FLOW_SENSOR::read()
{
    // Chama o método apropriado baseado no modo de leitura
    if (_readMode == FLOW_MODE_INTERRUPT)
    {
        readInterrupt();
    }
    else
    {
        readPulseIn();
    }
}

// Função de leitura baseada em interrupções
void FLOW_SENSOR::readInterrupt()
{
    unsigned long currentTime = millis();
    unsigned long elapsedTime = currentTime - _lastReadTime;

    // Calcula a taxa de fluxo apenas se passou tempo suficiente (intervalo mínimo de leitura)
    if (elapsedTime > 1000)
    { // Intervalo de 1 segundo
        // Desabilita a interrupção temporariamente
        detachInterrupt(digitalPinToInterrupt(_pin));

        // Calcula a taxa de fluxo (L/min)
        // Fórmula: (pulsos / fator de calibração) * (60 segundos / tempo decorrido em segundos)
        flowRate = (_pulseCount / YFS201_CALIBRATION_FACTOR) * (60.0 / (elapsedTime / 1000.0));
        literSeconds = flowRate / 60.0;

        // Adiciona ao volume total (em litros)
        totalVolume += (_pulseCount / (YFS201_CALIBRATION_FACTOR * 60)); // pulsos / (pulsos por L/min * 60) = litros

        // Print dos valores para debug
        Serial.print("Sensor de Fluxo (Int): ");
        Serial.print(flowRate);
        Serial.print(" L/min, Volume Total: ");
        Serial.print(totalVolume);
        Serial.println(" L");
        Serial.print("Contagem de Pulsos: ");
        Serial.print(_pulseCount);
        Serial.print(", Tempo decorrido: ");
        Serial.print(elapsedTime);
        Serial.println(" ms");

        // Reinicia o contador de pulsos
        _pulseCount = 0;

        // Reabilita a interrupção
        attachInterrupt(digitalPinToInterrupt(_pin), pulseCounter, FALLING);

        // Atualiza o tempo da última leitura
        _lastReadTime = currentTime;
    }
}

// Função de leitura baseada em pulseIn (método do manual)
void FLOW_SENSOR::readPulseIn()
{
    unsigned long currentTime = millis();
    unsigned long elapsedTime = currentTime - _lastReadTime;

    // Atualiza apenas a cada segundo para não sobrecarregar
    if (elapsedTime > 1000)
    {
        // Leitura dos tempos de pulso (HIGH e LOW)
        unsigned long pulseHigh = pulseIn(_pin, HIGH);
        unsigned long pulseLow = pulseIn(_pin, LOW);

        // Se não conseguiu ler pulsos, retorna
        if (pulseHigh == 0 || pulseLow == 0)
        {
            // Sem fluxo detectado
            flowRate = 0;

            Serial.println("Sensor de Fluxo (PulseIn): Sem fluxo detectado");

            _lastReadTime = currentTime;
            return;
        }

        // Calcula o período total do pulso
        float totalTime = pulseHigh + pulseLow; // em microssegundos

        // Calcula a frequência em Hz
        float frequency = 1000000.0 / totalTime; // 1000000 para converter de microssegundos para segundos

        // Calcula a vazão em L/min (usando a calibração de 7.5 pulsos por segundo por L/min)
        flowRate = frequency / YFS201_CALIBRATION_FACTOR;
        literSeconds = flowRate / 60.0;

        // Calcula o incremento no volume total
        float volumeIncrement = literSeconds * (elapsedTime / 1000.0);
        totalVolume += volumeIncrement;

        // Print dos valores para debug
        Serial.print("Sensor de Fluxo (PulseIn): ");
        Serial.print(flowRate);
        Serial.print(" L/min, Volume Total: ");
        Serial.print(totalVolume);
        Serial.println(" L");
        Serial.print("Frequência: ");
        Serial.print(frequency);
        Serial.print(" Hz, Tempo total: ");
        Serial.print(totalTime);
        Serial.println(" us");

        _lastReadTime = currentTime;
    }
}

// Reset o contador de volume total
void FLOW_SENSOR::resetTotalVolume()
{
    totalVolume = 0.0;
}

// Função de callback para a interrupção
void FLOW_SENSOR::pulseCounter()
{
    // Incrementa o contador de pulsos quando o sensor gera um pulso
    if (_instance != nullptr)
    {
        _instance->_pulseCount++;
    }
}
