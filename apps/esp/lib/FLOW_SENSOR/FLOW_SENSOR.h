#ifndef FLOW_SENSOR_H
#define FLOW_SENSOR_H

#include <Arduino.h>

// Definição das constantes do sensor YF-S201
// Fator de calibração: cerca de 7.5 pulsos por segundo correspondem a 1L/min
#define YFS201_CALIBRATION_FACTOR 7.5 // Pulsos por litro/minuto
#define FLOW_SENSOR_PIN 27            // Pino digital padrão para o sensor de fluxo de água

// Modos de leitura para o sensor
#define FLOW_MODE_INTERRUPT 0 // Usa interrupção (padrão)
#define FLOW_MODE_PULSEIN 1   // Usa pulseIn

class FLOW_SENSOR
{
public: // Construtor
    FLOW_SENSOR(int pin = FLOW_SENSOR_PIN);

    // Inicializa o sensor
    bool begin();

    // Define o modo de leitura (FLOW_MODE_INTERRUPT ou FLOW_MODE_PULSEIN)
    void setReadMode(uint8_t mode);
    // Função de leitura (deve ser chamada regularmente)
    void read();

    // Função de leitura baseada em interrupções
    void readInterrupt();

    // Função de leitura usando pulseIn (baseada no exemplo manual)
    void readPulseIn();

    // Função para resetar o contador total
    void resetTotalVolume();

    // Função estática para callback da interrupção
    static void pulseCounter(); // Variáveis públicas para acesso aos dados
    float flowRate;             // Taxa de fluxo em L/min
    volatile float totalVolume; // Volume total em litros
    int _pin;                   // Pino do sensor (público para permitir configuração)
    float literSeconds;         // Litros por segundo (para cálculos intermediários)

private:
    uint8_t _readMode;             // Modo de leitura (interrupção ou pulseIn)
    volatile uint32_t _pulseCount; // Contador de pulsos (volátil por ser usado em interrupção)
    unsigned long _lastReadTime;   // Último tempo de leitura
    static FLOW_SENSOR *_instance; // Instância estática para callback da interrupção
};

extern FLOW_SENSOR flow_sensor;

#endif
