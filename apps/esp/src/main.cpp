#include <Arduino.h>
#include <Oled.h>
#include <TH_SENSOR.h>
#include <SERVER.h>
#include <SOIL_SENSOR.h>
#include <FLOW_SENSOR.h>
#include <PUMP.h>
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>

// Display alternation configuration
#define DISPLAY_SWITCH_INTERVAL 5000 // 5 seconds alternation

// Function declarations
void handleDisplayMode(bool showSystemInfo);

// Intervalo de tempo para envio de dados ao servidor (2 minutos e meio = 150000 ms)
const unsigned long SEND_INTERVAL = 30 * 1000; // 30 segundos
unsigned long lastSendTime = 0;

// Identificadores das tarefas
TaskHandle_t Task1;
TaskHandle_t Task2;

// Mutex para proteger o acesso aos recursos compartilhados
SemaphoreHandle_t sensorMutex = NULL;

// Variáveis compartilhadas entre as tarefas
float currentTemp = 0;
float currentHumidity = 0;
float currentSoilTemp = 0;
int currentSoilMoisture = 0;
String soilHumidityText = "";
float currentFlowRate = 0;    // Taxa de fluxo atual em L/min
float currentTotalVolume = 0; // Volume total acumulado em litros

// Tarefa que roda no núcleo 0: Leitura dos sensores e envio de dados
void Task1code(void *pvParameters)
{
    for (;;)
    {
        // Registra tempo de início para otimização
        unsigned long startTime = millis();

        // Leitura dos sensores
        th_sensor.read();
        soil_sensor.read();
        flow_sensor.read();

        // Adquire o mutex para atualizar dados compartilhados
        if (sensorMutex != NULL && xSemaphoreTake(sensorMutex, portMAX_DELAY) == pdTRUE)
        {
            currentTemp = th_sensor.temperature;
            currentHumidity = th_sensor.humidity;
            currentSoilTemp = soil_sensor.soilTemperature;
            currentSoilMoisture = soil_sensor.moistureRaw;
            soilHumidityText = soil_sensor.soilHumidity + " " + String(soil_sensor.soilTemperature, 1) + "C";
            currentFlowRate = flow_sensor.flowRate;
            currentTotalVolume = flow_sensor.totalVolume;

            // Update pump controller with volume data for volume-based control
            pumpController.updateVolume(currentTotalVolume);

            xSemaphoreGive(sensorMutex);
        }

        // Adiciona leituras atuais para calcular a média posteriormente
        server.addSensorReading(
            currentTemp,
            currentHumidity,
            currentSoilTemp,
            currentSoilMoisture,
            currentFlowRate,
            currentTotalVolume);

        // Verifica se é hora de enviar dados ao servidor
        unsigned long currentMillis = millis();
        if (currentMillis - lastSendTime >= SEND_INTERVAL)
        {
            server.sendAverageSensorData();
            lastSendTime = currentMillis;
        }

        // Calcula quanto tempo já se passou desde o início da iteração
        unsigned long elapsedTime = millis() - startTime;

        // Garante um intervalo constante de 1 segundo entre leituras
        if (elapsedTime < 1000)
        {
            vTaskDelay((1000 - elapsedTime) / portTICK_PERIOD_MS);
        }
        else
        {
            vTaskDelay(1); // Yield para outras tarefas
        }
    }
}

// Tarefa que roda no núcleo 1: Atualização do display OLED
void Task2code(void *pvParameters)
{
    // Controle de alternância do display (5 segundos cada)
    unsigned long lastDisplaySwitch = millis();
    bool showSystemInfo = false; // Começa mostrando dados dos sensores

    for (;;)
    {
        // Verifica se é hora de alternar o display
        if (millis() - lastDisplaySwitch >= DISPLAY_SWITCH_INTERVAL)
        {
            showSystemInfo = !showSystemInfo;
            lastDisplaySwitch = millis();

            // Log limpo de alternância do display
            Serial.print("\033[2J\033[H"); // Limpa tela e move cursor para início
            Serial.println("========================================");
            Serial.print("[DISPLAY] Mostrando: ");
            Serial.println(showSystemInfo ? "INFO DO SISTEMA" : "DADOS DOS SENSORES");
            Serial.println("========================================");
        }

        // Atualiza o display
        handleDisplayMode(showSystemInfo);

        // Delay para a próxima atualização do display
        vTaskDelay(100 / portTICK_PERIOD_MS);
    }
}

// Handle display mode with automatic alternation
void handleDisplayMode(bool showSystemInfo)
{
    // Adquire o mutex para ler dados compartilhados
    if (sensorMutex != NULL && xSemaphoreTake(sensorMutex, 10 / portTICK_PERIOD_MS) == pdTRUE)
    {
        if (showSystemInfo)
        {
            // Mostra informações do sistema ESP32
            oled.displaySystemInfo();
        }
        else
        {
            // Exibe os dados dos sensores incluindo o fluxo de água e status da bomba
            String pumpStatus = pumpController.getPumpStatusText();
            String pumpDetails = pumpController.getPumpDetailsText();
            oled.outputWithPump(currentTemp, currentHumidity, soilHumidityText, currentFlowRate, currentTotalVolume, pumpStatus, pumpDetails);
        }
        xSemaphoreGive(sensorMutex);

        // Atualiza o display
        oled.update();
    }
}

void setup()
{
    Serial.begin(115200); // Aumenta baud rate para logs mais rápidos

    // Inicializa o gerador de números aleatórios
    randomSeed(analogRead(0));

    Serial.println("\n\n========================================");
    Serial.println("       ESP32 GREENHOUSE SYSTEM");
    Serial.println("========================================");

    // Inicializa componentes silenciosamente
    if (!server.begin())
    {
        Serial.println("[ERRO] WiFi");
        for (;;)
            ;
    }
    if (!th_sensor.begin())
    {
        Serial.println("[ERRO] Sensor TH");
        for (;;)
            ;
    }
    if (!oled.begin())
    {
        Serial.println("[ERRO] OLED");
        for (;;)
            ;
    }
    if (!soil_sensor.begin())
    {
        Serial.println("[ERRO] Sensor Solo");
        for (;;)
            ;
    }
    if (!flow_sensor.begin())
    {
        Serial.println("[ERRO] Sensor Fluxo");
        for (;;)
            ;
    }
    if (!pumpController.begin())
    {
        Serial.println("[ERRO] Pump Controller");
        for (;;)
            ;
    }

    Serial.println("[OK] Todos componentes inicializados");
    Serial.print("[OK] IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("[OK] Pump HTTP Server: http://");
    Serial.print(WiFi.localIP());
    Serial.println(":8080");

    oled.clear();
    oled.displayWiFiConnection("Dantas_2.4G", WiFi.localIP().toString());
    oled.update();
    delay(2000);

    // Criação do mutex
    sensorMutex = xSemaphoreCreateMutex();
    if (sensorMutex == NULL)
    {
        Serial.println("[ERRO] Mutex");
        for (;;)
            ;
    }

    // Criação das tarefas
    xTaskCreatePinnedToCore(Task1code, "SensorTask", 10000, NULL, 1, &Task1, 0);
    delay(500);
    xTaskCreatePinnedToCore(Task2code, "DisplayTask", 10000, NULL, 1, &Task2, 1);

    Serial.println("========================================");
    Serial.println("         SISTEMA INICIADO!");
    Serial.println("========================================\n");
}

void loop()
{
    // Loop principal vazio - tarefas FreeRTOS gerenciam tudo
    delay(1000);
}
