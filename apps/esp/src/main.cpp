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
    Serial.print("Tarefa de Sensores iniciada no núcleo: ");
    Serial.println(xPortGetCoreID());

    // Contador de leituras para debug
    uint32_t readingCounter = 0;

    for (;;)
    {
        // Registra tempo de início para otimização
        unsigned long startTime = millis();

        // Leitura dos sensores
        th_sensor.read();
        soil_sensor.read();
        flow_sensor.read();

        readingCounter++;

        // A cada 30 leituras, mostra estatística
        if (readingCounter % 30 == 0)
        {
            Serial.print("Core 0: Leituras realizadas: ");
            Serial.println(readingCounter);
        }

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
        else if (sensorMutex == NULL)
        {
            Serial.println("ERRO: sensorMutex é NULL na Task1!");
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
            Serial.println("Enviando dados ao servidor...");
            server.sendAverageSensorData();
            lastSendTime = currentMillis;
            Serial.println("Dados enviados com sucesso!");
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
    Serial.print("Tarefa de Display iniciada no núcleo: ");
    Serial.println(xPortGetCoreID());

    // Contador para medir a taxa de atualização do display
    uint32_t frameCounter = 0;
    unsigned long lastFpsCheck = millis();

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
            Serial.print("Display alternando para: ");
            Serial.println(showSystemInfo ? "Sistema Info" : "Dados Sensores");
        }

        // Atualiza o display
        handleDisplayMode(showSystemInfo);

        // Registra o frame
        frameCounter++;

        // A cada 5 segundos, calcula e mostra a taxa de atualização (FPS)
        if (millis() - lastFpsCheck >= 5000)
        {
            float fps = frameCounter / 5.0;
            Serial.print("Core 1: Display refresh rate: ");
            Serial.print(fps);
            Serial.println(" FPS");
            frameCounter = 0;
            lastFpsCheck = millis();
        }

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
    else if (sensorMutex == NULL)
    {
        Serial.println("ERRO: sensorMutex é NULL na Task2!");
    }
}

void setup()
{
    Serial.begin(9600);

    // Inicializa o gerador de números aleatórios
    randomSeed(analogRead(0));

    Serial.println("Inicializando componentes em sistema dual core ESP32...");

    if (!server.begin())
    {
        Serial.println(F("Error initializing server!"));
        for (;;)
            ;
    }

    if (!th_sensor.begin())
    {
        Serial.println(F("Error initializing sensor!"));
        for (;;)
            ;
    }

    if (!oled.begin())
    {
        Serial.println(F("SSD1306 allocation failed"));
        for (;;)
            ;
    }

    if (!soil_sensor.begin())
    {
        Serial.println(F("Error initializing soil sensor!"));
        for (;;)
            ;
    }

    // Inicializa o sensor de fluxo
    if (!flow_sensor.begin())
    {
        Serial.println(F("Error initializing flow sensor!"));
        for (;;)
            ;
    }

    // Initialize pump controller (HTTP server for pump control)
    if (!pumpController.begin())
    {
        Serial.println(F("Error initializing pump controller!"));
        for (;;)
            ;
    }
    Serial.println("PumpController inicializado - HTTP Server para controle da bomba ativo");

    oled.clear();
    delay(200);

    // Display WiFi connection status
    oled.displayWiFiConnection("Dantas_2.4G", WiFi.localIP().toString());
    oled.update();
    delay(3000);

    Serial.print("Inicializando em modo dual core - Núcleo atual: ");
    Serial.println(xPortGetCoreID());
    Serial.println("Setup completed. Preparing to start tasks...");

    // Criação do mutex
    Serial.println("Criando sensorMutex...");
    sensorMutex = xSemaphoreCreateMutex();

    if (sensorMutex == NULL)
    {
        Serial.println("ERRO: Falha ao criar sensorMutex!");
        for (;;)
            ; // Para o sistema se não conseguir criar o mutex
    }
    else
    {
        Serial.println("sensorMutex criado com sucesso!");
    }

    // Criação das tarefas
    Serial.println("Criando tarefa de sensores no Núcleo 0...");
    xTaskCreatePinnedToCore(
        Task1code,    /* Task function */
        "SensorTask", /* name of task */
        10000,        /* stack size of task */
        NULL,         /* parameter of the task */
        1,            /* priority of the task */
        &Task1,       /* task handle to keep track of created task */
        0);           /* core where the task should run */

    delay(500); // Pequeno delay para garantir que a primeira tarefa inicie

    Serial.println("Criando tarefa de display no Núcleo 1...");
    xTaskCreatePinnedToCore(
        Task2code,     /* Task function */
        "DisplayTask", /* name of task */
        10000,         /* stack size of task */
        NULL,          /* parameter of the task */
        1,             /* priority of the task */
        &Task2,        /* task handle to keep track of created task */
        1);            /* core where the task should run */

    Serial.println("Sistema dual core iniciado com sucesso!");
    Serial.println("Núcleo 0: Leitura de sensores e comunicação");
    Serial.println("Núcleo 1: Display OLED");
}

void loop()
{
    // O loop principal serve para monitoramento do sistema
    // Verificações de status a cada 30 segundos
    static unsigned long lastStatusCheck = 0;

    if (millis() - lastStatusCheck >= 30000)
    {
        lastStatusCheck = millis();

        // Exibe informações do sistema
        Serial.println("\n----- Status do Sistema -----");
        Serial.print("Uptime: ");
        Serial.print(millis() / 1000);
        Serial.println(" segundos");

        Serial.print("Core atual do loop: ");
        Serial.println(xPortGetCoreID());

        // Verifica memória disponível
        Serial.print("Heap livre: ");
        Serial.print(ESP.getFreeHeap());
        Serial.println(" bytes");

        Serial.println("---------------------------\n");
    }

    // Yield para as tarefas de alta prioridade
    delay(1000);
}
