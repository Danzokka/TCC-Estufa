#include <Arduino.h>
#include <Oled.h>
#include <TH_SENSOR.h>
#include <SERVER.h>
#include <SOIL_SENSOR.h>
#include <FLOW_SENSOR.h>
// PUMP reativado para testes HTTP com LED interno
#include <PUMP.h>
// MODO DESENVOLVIMENTO: QR_CONFIG desabilitado
// #include <QR_CONFIG.h>
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>

#define SWITCHPIN 22
#define CONFIG_BUTTON_PIN 0 // Boot button for configuration mode

// System modes
enum SystemMode
{
    MODE_CONFIGURATION,
    MODE_NORMAL_OPERATION,
    MODE_SETUP
};

SystemMode currentMode = MODE_SETUP;

// Function declarations
void handleConfigurationMode();
void handleNormalDisplayMode(int &switchState, int &lastSwitchState, bool &needUpdate, int &animationStep);
void checkForConfiguration();

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
        flow_sensor.read(); // Lê o sensor de fluxo de água

        readingCounter++;

        // A cada 30 leituras, mostra estatística
        if (readingCounter % 30 == 0)
        {
            Serial.print("Core 0: Leituras realizadas: ");
            Serial.println(readingCounter);
        }

        // Adquire o mutex para atualizar dados compartilhados (com verificação de segurança)
        if (sensorMutex != NULL && xSemaphoreTake(sensorMutex, portMAX_DELAY) == pdTRUE)
        {
            currentTemp = th_sensor.temperature;
            currentHumidity = th_sensor.humidity;
            currentSoilTemp = soil_sensor.soilTemperature;
            currentSoilMoisture = soil_sensor.moistureRaw;
            soilHumidityText = soil_sensor.soilHumidity + " " + String(soil_sensor.soilTemperature, 1) + "C";
            currentFlowRate = flow_sensor.flowRate;
            currentTotalVolume = flow_sensor.totalVolume;

            // PUMP reativado: Update pump controller with volume data for volume-based control
            pumpController.updateVolume(currentTotalVolume);

            xSemaphoreGive(sensorMutex);
        }
        else if (sensorMutex == NULL)
        {
            Serial.println("ERRO: sensorMutex é NULL na Task1!");
        } // TEMPORÁRIO: MODO DESENVOLVIMENTO - Configuração desabilitada
        // Check for configuration in configuration mode
        if (currentMode == MODE_CONFIGURATION)
        {
            Serial.println("MODE_CONFIGURATION detectado na Task1 - forçando MODE_NORMAL_OPERATION");
            currentMode = MODE_NORMAL_OPERATION;
        }

        // Only send sensor data in normal operation mode
        if (currentMode == MODE_NORMAL_OPERATION)
        {
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
                // Envia as médias dos dados coletados no intervalo para o backend
                server.sendAverageSensorData();

                // Atualiza o tempo do último envio
                lastSendTime = currentMillis;
                Serial.println("Dados enviados com sucesso!");
            }
        }

        // Calcula quanto tempo já se passou desde o início da iteração
        unsigned long elapsedTime = millis() - startTime;

        // Garante um intervalo constante de 1 segundo entre leituras
        // Se a execução for rápida, espera o tempo restante
        if (elapsedTime < 1000)
        {
            vTaskDelay((1000 - elapsedTime) / portTICK_PERIOD_MS);
        }
        else
        {
            // Se a execução demorar mais de 1 segundo, não há delay
            vTaskDelay(1); // Yield para outras tarefas
        }
    }
}

// Tarefa que roda no núcleo 1: Atualização do display OLED
void Task2code(void *pvParameters)
{
    Serial.print("Tarefa de Display iniciada no núcleo: ");
    Serial.println(xPortGetCoreID()); // Contador para medir a taxa de atualização do display
    uint32_t frameCounter = 0;
    unsigned long lastFpsCheck = millis();
    int switchState = 0;      // Adicionar declaração da variável
    int lastSwitchState = -1; // Inicializado com valor inválido para forçar a primeira atualização
    bool needUpdate = true;   // Adicionar declaração da variável    // Controle de animação
    int animationStep = 0;
    int animationSpeed = 50; // Velocidade da animação (ms)

    for (;;)
    { // Handle different system modes
        switch (currentMode)
        {
        case MODE_CONFIGURATION:
            // TEMPORÁRIO: MODO DESENVOLVIMENTO - Ignora configuração QR
            Serial.println("MODE_CONFIGURATION desabilitado - forçando MODE_NORMAL_OPERATION");
            currentMode = MODE_NORMAL_OPERATION;
            break;

        case MODE_NORMAL_OPERATION:
            handleNormalDisplayMode(switchState, lastSwitchState, needUpdate, animationStep);
            break;

        case MODE_SETUP:
            oled.displayConfigurationStatus("Starting", "System initializing...");
            oled.update();
            break;
        }

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
        } // Check for configuration timeout or button press
        if (currentMode == MODE_CONFIGURATION)
        {
            // MODO DESENVOLVIMENTO: QR Config desabilitado
            /*
            if (qrConfig.checkConfigTimeout())
            {
                Serial.println("Configuration timeout - restarting");
                ESP.restart();
            }
            */
            Serial.println("QR Config desabilitado - saindo do modo configuração");
            currentMode = MODE_NORMAL_OPERATION;
        }

        // Delay para a próxima atualização do display
        vTaskDelay(100 / portTICK_PERIOD_MS);
    }
}

// Handle configuration mode display
void handleConfigurationMode()
{
    static unsigned long lastQRUpdate = 0;

    if (millis() - lastQRUpdate > 1000)
    { // Update QR code display every second
        lastQRUpdate = millis();

        // MODO DESENVOLVIMENTO: QR Config desabilitado
        /*
        if (qrConfig.isInConfigMode())
        {
            oled.displayQRCode(&qrConfig);
        }
        else
        {
            oled.displayConfigurationStatus("Config Mode", "Generating QR...");
        }
        */

        // Mostra que está em modo desenvolvimento
        oled.displayConfigurationStatus("Desenvolvimento", "QR Config DESABILITADO");
        oled.update();
    }
}

// Handle normal sensor display mode
void handleNormalDisplayMode(int &switchState, int &lastSwitchState, bool &needUpdate, int &animationStep)
{
    // Verifica o estado da chave para determinar o modo de exibição
    switchState = digitalRead(SWITCHPIN);

    // Verificamos se o estado do switch mudou para evitar atualizações desnecessárias    if (switchState != lastSwitchState)
    {
        lastSwitchState = switchState;
        needUpdate = true;
        Serial.print("Alterando modo de exibição: ");
        Serial.println(switchState == HIGH ? "Sistema Info" : "Dados Sensores");
    } // Adquire o mutex para ler dados compartilhados (com verificação de segurança)
    if (sensorMutex != NULL && xSemaphoreTake(sensorMutex, 10 / portTICK_PERIOD_MS) == pdTRUE)
    {
        // Atualiza o display com base no estado do switch
        if (switchState == HIGH)
        {
            // Mostra informações do sistema ESP32
            oled.displaySystemInfo();
        }
        else
        {
            // PUMP reativado: Exibe os dados dos sensores incluindo o fluxo de água e status da bomba
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
    else if (needUpdate)
    {
        Serial.println("Mutex ocupado, adiando atualização do display");
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
    } // Inicializa o sensor de fluxo
    if (!flow_sensor.begin())
    {
        Serial.println(F("Error initializing flow sensor!"));
        for (;;)
            ;
    }

    // PUMP reativado para testes HTTP com LED interno
    // Initialize pump controller
    if (!pumpController.begin())
    {
        Serial.println(F("Error initializing pump controller!"));
        for (;;)
            ;
    }
    Serial.println("PumpController ativado com LED interno (GPIO 2) para testes");

    pinMode(SWITCHPIN, INPUT);
    pinMode(CONFIG_BUTTON_PIN, INPUT_PULLUP); // Configuration buttonoled.clear();
    delay(200);

    // TEMPORÁRIO: MODO DESENVOLVIMENTO - QR CONFIG COMPLETAMENTE DESABILITADO
    Serial.println("=== MODO DESENVOLVIMENTO ===");
    Serial.println("QR Config: DESABILITADO");
    Serial.println("WiFi: Hardcoded via SERVER");
    Serial.println("============================");

    currentMode = MODE_NORMAL_OPERATION;

    // Try to connect with hardcoded WiFi for development
    if (server.begin())
    {
        Serial.println("Connected to WiFi in development mode");
        oled.displayWiFiConnection("Dantas_2.4G", WiFi.localIP().toString());
        oled.update();
        delay(3000);
    }
    else
    {
        Serial.println("WiFi connection failed - continuing in offline mode");
        oled.displayConfigurationStatus("Dev Mode", "WiFi: Offline");
        oled.update();
        delay(3000);
    }

    /*
    // CÓDIGO ORIGINAL DE QR CONFIG - COMENTADO PARA DESENVOLVIMENTO
    // Check if device needs configuration
    if (qrConfig.needsConfiguration() || digitalRead(CONFIG_BUTTON_PIN) == LOW)
    {
        Serial.println("Device needs configuration - entering QR mode");
        currentMode = MODE_CONFIGURATION;

        if (!qrConfig.enterConfigMode())
        {
            Serial.println("Failed to enter configuration mode");
            oled.displayConfigurationStatus("Config Error", "QR generation failed");
            oled.update();
            delay(5000);
        }
        else
        {
            Serial.println("Configuration mode active - QR code ready");

            // Start HTTP server for configuration
            if (qrConfig.startConfigServer())
            {
                Serial.println("Configuration HTTP server started");
            }
            else
            {
                Serial.println("Failed to start configuration server");
            }
        }
    }
    else
    {
        Serial.println("Device configured - connecting to WiFi");
        if (qrConfig.connectToWiFi())
        {
            currentMode = MODE_NORMAL_OPERATION;
            oled.displayWiFiConnection(qrConfig.getWiFiSSID(), WiFi.localIP().toString());
            oled.update();
            delay(3000);
        }
        else
        {
            Serial.println("WiFi connection failed - entering configuration mode");
            currentMode = MODE_CONFIGURATION;
            qrConfig.enterConfigMode();

            // Start HTTP server for configuration
            if (qrConfig.startConfigServer())
            {
                Serial.println("Configuration HTTP server started");
            }
        }
    }
    */
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
    // TEMPORÁRIO: MODO DESENVOLVIMENTO - QR CONFIG COMPLETAMENTE DESABILITADO
    // Handle HTTP server requests in configuration mode
    if (currentMode == MODE_CONFIGURATION)
    {
        // qrConfig.handleServerRequests();

        // Check for configuration timeout
        // if (qrConfig.checkConfigTimeout())
        // {
        //     Serial.println("Configuration timeout reached - exiting config mode");
        //     qrConfig.exitConfigMode();
        //     qrConfig.stopConfigServer();
        //     currentMode = MODE_NORMAL_OPERATION;
        // }

        // Força modo normal para desenvolvimento
        Serial.println("Forçando MODE_NORMAL_OPERATION (desenvolvimento)");
        currentMode = MODE_NORMAL_OPERATION;
    }

    // O loop principal agora serve para monitoramento do sistema
    // Como está executando no Core 1, faz verificações de status a cada 30 segundos
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

// Check for configuration data reception via Serial or WiFi
void checkForConfiguration()
{
    // MODO DESENVOLVIMENTO: QR Config completamente desabilitado
    /*
    // Handle HTTP server requests (this also handles configuration reception)
    qrConfig.handleServerRequests();

    // Check for configuration via Serial (for testing)
    if (Serial.available())
    {
        String configData = Serial.readStringUntil('\n');
        configData.trim();

        if (configData.startsWith("{") && configData.endsWith("}"))
        {
            Serial.println("Received configuration data via Serial:");
            Serial.println(configData);

            // Parse JSON configuration
            JsonDocument doc;
            DeserializationError error = deserializeJson(doc, configData);

            if (!error)
            {
                if (qrConfig.saveConfiguration(doc.as<JsonObject>()))
                {
                    Serial.println("Configuration saved successfully!");

                    // Try to connect to WiFi with new credentials
                    if (qrConfig.connectToWiFi())
                    {
                        Serial.println("WiFi connected with new configuration");
                        currentMode = MODE_NORMAL_OPERATION;
                        qrConfig.exitConfigMode();

                        // Show success message
                        oled.displayWiFiConnection(qrConfig.getWiFiSSID(), WiFi.localIP().toString());
                        oled.update();
                        delay(3000);
                    }
                    else
                    {
                        Serial.println("Failed to connect with new configuration");
                        oled.displayConfigurationStatus("Config Error", "WiFi connection failed");
                        oled.update();
                    }
                }
                else
                {
                    Serial.println("Failed to save configuration");
                    oled.displayConfigurationStatus("Config Error", "Save failed");
                    oled.update();
                }
            }
            else
            {
                Serial.printf("JSON parsing failed: %s\n", error.c_str());
                oled.displayConfigurationStatus("Config Error", "Invalid JSON");
                oled.update();
            }
        }
    }

    // TODO: Add HTTP server to receive configuration from frontend
    // This would handle POST requests from the frontend QR scanner
    */

    Serial.println("checkForConfiguration: QR Config desabilitado em modo desenvolvimento");
}
