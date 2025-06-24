#include "OLED.h"
// MODO DESENVOLVIMENTO: QR_CONFIG desabilitado
// #include "QR_CONFIG.h"

OledDisplay::OledDisplay()
	: display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET)
{
}

bool OledDisplay::begin()
{
	Wire.begin(21, 19); // SDA = 21, SCL = 19
	return display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
}

void OledDisplay::clear()
{
	display.clearDisplay();
	display.display();
}

void OledDisplay::showBitmap(const uint8_t *bitmap)
{
	display.clearDisplay(); // Limpa o display antes
	// Note os parâmetros: x, y, bitmap, w, h, color
	display.drawBitmap(0, 0, bitmap, SCREEN_WIDTH, SCREEN_HEIGHT, 1);
	display.display(); // Atualiza o display
}

void OledDisplay::animateBitmap(const uint8_t *bitmap, int speed, int animationStep)
{
	// Define a amplitude do movimento (quanto o bitmap vai subir/descer)
	const int amplitude = 4;
	int offset = 0;

	// Calcula o offset com base na etapa da animação
	// Dividimos a animação em três fases
	int totalSteps = amplitude * 2 + amplitude * 2 + amplitude;
	animationStep = animationStep % totalSteps;

	if (animationStep <= amplitude * 2)
	{
		// Fase 1: Movimento para cima
		offset = -animationStep / 2;
	}
	else if (animationStep <= amplitude * 4)
	{
		// Fase 2: Movimento para baixo
		offset = -(amplitude - ((animationStep - amplitude * 2) / 2 - amplitude));
	}
	else
	{
		// Fase 3: Movimento de volta para a posição original
		offset = -(-amplitude + (animationStep - amplitude * 4) / 2);
	}

	display.clearDisplay();
	display.drawBitmap(0, offset, bitmap, SCREEN_WIDTH, SCREEN_HEIGHT, 1);
}

void OledDisplay::output(float temperature, float humidity, String soilHumidity)
{
	display.clearDisplay();
	display.setTextSize(1);
	display.setTextColor(WHITE);
	display.setCursor(0, 0);
	display.println("Temperatura: " + String(temperature) + " C");
	display.println("Umidade: " + String(humidity) + " %");
	display.println("Solo: " + soilHumidity);
}

void OledDisplay::outputWithFlow(float temperature, float humidity, String soilHumidity, float flowRate, float totalVolume)
{
	display.clearDisplay();
	display.setTextSize(1);
	display.setTextColor(WHITE);
	display.setCursor(0, 0);
	display.println("Temperatura: " + String(temperature) + " C");
	display.println("Umidade: " + String(humidity) + " %");
	display.println("Solo: " + soilHumidity);

	// Linha separadora
	display.drawLine(0, 33, 128, 33, WHITE);

	// Dados de fluxo de água
	display.setCursor(0, 37);
	display.println("Fluxo: " + String(flowRate, 2) + " L/min");
	display.println("Vol. Total: " + String(totalVolume, 1) + " L");
}

void OledDisplay::outputWithPump(float temperature, float humidity, String soilHumidity, float flowRate, float totalVolume, String pumpStatus, String pumpDetails)
{
	display.clearDisplay();
	display.setTextSize(1);
	display.setTextColor(WHITE);
	display.setCursor(0, 0);

	// First line: Temperature and Humidity on same line
	display.println("T:" + String(temperature, 1) + "C H:" + String(humidity, 1) + "%");

	// Second line: Soil moisture
	display.println("Solo: " + soilHumidity);

	// Third line: Flow data
	display.println("Fluxo: " + String(flowRate, 1) + " L/min");

	// Fourth line: Volume
	display.println("Volume: " + String(totalVolume, 1) + " L");

	// Linha separadora
	display.drawLine(0, 33, 128, 33, WHITE);

	// Pump status (larger text for visibility)
	display.setCursor(0, 37);
	display.setTextSize(1);
	display.println(pumpStatus);
	display.println(pumpDetails);
}

void OledDisplay::outputPumpActivation(int duration, float waterAmount)
{
	display.clearDisplay();
	display.setTextSize(1);
	display.setTextColor(WHITE);

	// Título
	display.setCursor(0, 0);
	display.println("BOMBA ATIVADA");

	// Linha separadora
	display.drawLine(0, 10, 128, 10, WHITE);

	// Informações da ativação
	display.setCursor(0, 15);
	display.println("Duracao: " + String(duration) + "s");
	display.println("Volume: " + String(waterAmount, 1) + "L");

	// Barra de progresso simples
	display.fillRect(2, 52, 124, 8, WHITE);
}

void OledDisplay::displayQRCode(QRConfigManager *qrConfig)
{
	// MODO DESENVOLVIMENTO: QR Config desabilitado
	/*
	if (!qrConfig)
	{
		displayConfigurationStatus("QR Error", "Config manager null");
		return;
	}

	display.clearDisplay();

	// Check if QR code is available
	int qrSize = qrConfig->getQRSize();
	if (qrSize == 0)
	{
		displayConfigurationStatus("QR Generation", "Creating QR code...");
		return;
	}

	// Calculate scaling and centering for 128x64 display
	int scale = min(SCREEN_WIDTH / qrSize, SCREEN_HEIGHT / qrSize);
	if (scale < 1)
		scale = 1;

	int qrPixelSize = qrSize * scale;
	int offsetX = (SCREEN_WIDTH - qrPixelSize) / 2;
	int offsetY = (SCREEN_HEIGHT - qrPixelSize) / 2;

	// Draw QR code
	for (int y = 0; y < qrSize; y++)
	{
		for (int x = 0; x < qrSize; x++)
		{
			if (qrConfig->getQRModule(x, y))
			{
				// Draw scaled pixel
				for (int dy = 0; dy < scale; dy++)
				{
					for (int dx = 0; dx < scale; dx++)
					{
						int pixelX = offsetX + x * scale + dx;
						int pixelY = offsetY + y * scale + dy;

						if (pixelX >= 0 && pixelX < SCREEN_WIDTH &&
							pixelY >= 0 && pixelY < SCREEN_HEIGHT)
						{
							display.drawPixel(pixelX, pixelY, WHITE);
						}
					}
				}
			}
		}
	}

	// Add small text indicator if space allows
	if (offsetY > 8)
	{
		display.setTextSize(1);
		display.setTextColor(WHITE);
		display.setCursor(0, 0);
		display.println("Scan QR Code");
	}
	*/
	// Em modo desenvolvimento, mostra mensagem alternativa
	displayConfigurationStatus("DESENVOLVIMENTO", "QR Code desabilitado");
}

void OledDisplay::displaySystemInfo()
{
	display.clearDisplay();
	display.setTextSize(1);
	display.setTextColor(WHITE);

	// Título centralizado
	display.setCursor(20, 0);
	display.println("ESP32 SYSTEM INFO");

	// Linha separadora
	display.drawLine(0, 9, 128, 9, WHITE);

	// WiFi Info
	display.setCursor(0, 12);
	if (WiFi.status() == WL_CONNECTED)
	{
		// Trunca SSID se muito longo
		String ssid = WiFi.SSID();
		if (ssid.length() > 16)
		{
			ssid = ssid.substring(0, 13) + "...";
		}
		display.println("WiFi: " + ssid);
		display.println("IP: " + WiFi.localIP().toString());

		// Signal strength com indicador visual
		int rssi = WiFi.RSSI();
		String signalQuality;
		if (rssi > -50)
			signalQuality = "Excelente";
		else if (rssi > -60)
			signalQuality = "Bom";
		else if (rssi > -70)
			signalQuality = "Regular";
		else
			signalQuality = "Fraco";

		display.println("Sinal: " + signalQuality);
	}
	else
	{
		display.println("WiFi: Desconectado");
		display.println("Status: Offline");
	}

	// Uptime formatado
	unsigned long uptimeMs = millis();
	unsigned long days = uptimeMs / 86400000;
	unsigned long hours = (uptimeMs % 86400000) / 3600000;
	unsigned long minutes = (uptimeMs % 3600000) / 60000;

	display.setCursor(0, 45);
	if (days > 0)
	{
		display.println("Up: " + String(days) + "d " + String(hours) + "h " + String(minutes) + "m");
	}
	else
	{
		display.println("Uptime: " + String(hours) + "h " + String(minutes) + "m");
	}

	// Memory info com percentual
	uint32_t freeHeap = ESP.getFreeHeap();
	uint32_t totalHeap = ESP.getHeapSize();
	uint8_t memPercent = ((totalHeap - freeHeap) * 100) / totalHeap;

	display.println("RAM: " + String(freeHeap / 1024) + "KB (" + String(100 - memPercent) + "% livre)");

	// MAC Address (últimos 8 chars) e temperatura do chip
	String mac = WiFi.macAddress();
	display.println("MAC: ..." + mac.substring(mac.length() - 8) + " " + String((int)temperatureRead()) + "C");
}

void OledDisplay::displayConfigurationStatus(const String &status, const String &details)
{
	display.clearDisplay();
	display.setTextSize(1);
	display.setTextColor(WHITE);

	// Main status
	display.setCursor(0, 0);
	display.println("ESP32 Greenhouse");

	display.setCursor(0, 16);
	display.println("Status: " + status);

	// Details if provided
	if (details.length() > 0)
	{
		display.setCursor(0, 32);
		display.println(details);
	}

	// Add border
	display.drawRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, WHITE);
}

void OledDisplay::displayWiFiConnection(const String &ssid, const String &ip)
{
	display.clearDisplay();
	display.setTextSize(1);
	display.setTextColor(WHITE);

	display.setCursor(0, 0);
	display.println("WiFi Connected");

	display.setCursor(0, 16);
	display.println("SSID: " + ssid.substring(0, 18)); // Truncate if too long

	if (ip.length() > 0)
	{
		display.setCursor(0, 32);
		display.println("IP: " + ip);
	}

	display.setCursor(0, 48);
	display.println("Ready for config");
}

void OledDisplay::update()
{
	display.display();
}

// Bitmap simples (apenas zeros para economizar espaço)
const unsigned char PROGMEM myBitmap[] = {
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};

// Instância global do display
OledDisplay oled;
