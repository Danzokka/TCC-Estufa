---
applyTo: "**/*.test.{ts,tsx,js,jsx},**/*.spec.{ts,tsx,js,jsx}"
---

# Testing Guidelines - IoT Greenhouse System

## Links

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [PlatformIO Testing](https://docs.platformio.org/en/latest/advanced/unit-testing/index.html)
- [Python Testing with pytest](https://docs.pytest.org/en/stable/)

## Multi-Platform Testing Strategy

This IoT greenhouse system requires comprehensive testing across multiple platforms:

### 1. Frontend Testing (Next.js/React)

- **Unit Tests**: Component logic and user interactions
- **Integration Tests**: API integration and data flow
- **E2E Tests**: Complete user workflows and real-time features
- **PWA Tests**: Offline functionality and push notifications

### 2. Backend Testing (NestJS)

- **Unit Tests**: Service logic and business rules
- **Integration Tests**: API endpoints and database operations
- **WebSocket Tests**: Real-time communication
- **Device Integration Tests**: ESP32 communication

### 3. Hardware Testing (ESP32)

- **Unit Tests**: Sensor reading functions and communication protocols
- **Integration Tests**: Hardware component interactions
- **Mock Tests**: Simulated sensor data and network conditions
- **Performance Tests**: Power consumption and memory usage

### 4. AI/ML Testing (Python)

- **Model Tests**: Prediction accuracy and data processing
- **Pipeline Tests**: Data flow and preprocessing
- **Performance Tests**: Training time and inference speed
- **Integration Tests**: API communication and real-time predictions

## Frontend Testing Patterns

### IoT Dashboard Component Tests

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { SensorWidget } from './SensorWidget';
import { mockSensorData } from '../__mocks__/sensorData';

describe('SensorWidget', () => {
  it('should display real-time sensor data', async () => {
    render(
      <SensorWidget
        sensor={mockSensorData.temperature}
        thresholds={{ min: 18, max: 26 }}
      />
    );

    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('22.5°C')).toBeInTheDocument();

    // Test threshold alerts
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should show alert when sensor value exceeds threshold', async () => {
    const highTempSensor = { ...mockSensorData.temperature, value: 30 };

    render(
      <SensorWidget
        sensor={highTempSensor}
        thresholds={{ min: 18, max: 26 }}
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/temperature too high/i)).toBeInTheDocument();
  });

  it('should handle offline sensor status', () => {
    const offlineSensor = {
      ...mockSensorData.temperature,
      status: 'offline' as const
    };

    render(<SensorWidget sensor={offlineSensor} />);

    expect(screen.getByText(/offline/i)).toBeInTheDocument();
    expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
  });
});
```

### Real-time Communication Tests

```typescript
import { renderHook, act } from "@testing-library/react";
import { useSensorData } from "../hooks/useSensorData";
import { mockWebSocket } from "../__mocks__/websocket";

describe("useSensorData", () => {
  it("should subscribe to sensor updates", async () => {
    const { result } = renderHook(() => useSensorData("sensor-1"));

    expect(mockWebSocket.on).toHaveBeenCalledWith(
      "sensor-update",
      expect.any(Function)
    );

    // Simulate WebSocket data
    act(() => {
      mockWebSocket.emit("sensor-update", {
        sensorId: "sensor-1",
        value: 25.3,
        timestamp: new Date().toISOString(),
      });
    });

    expect(result.current.data?.value).toBe(25.3);
  });

  it("should handle connection failures gracefully", async () => {
    const { result } = renderHook(() => useSensorData("sensor-1"));

    act(() => {
      mockWebSocket.emit("disconnect");
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.error).toBe("Connection lost");
  });
});
```

### Control Interface Tests

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ControlPanel } from './ControlPanel';
import { mockActuator } from '../__mocks__/actuators';

describe('ControlPanel', () => {
  it('should send control commands with confirmation', async () => {
    const mockControl = jest.fn().mockResolvedValue({ success: true });

    render(
      <ControlPanel
        actuator={mockActuator.waterPump}
        onControl={mockControl}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /turn on/i }));

    // Should show confirmation dialog
    expect(screen.getByText(/confirm action/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(mockControl).toHaveBeenCalledWith('water-pump-1', 'on');
    });
  });

  it('should disable controls when device is offline', () => {
    const offlineActuator = { ...mockActuator.waterPump, isOnline: false };

    render(<ControlPanel actuator={offlineActuator} />);

    const button = screen.getByRole('button', { name: /turn on/i });
    expect(button).toBeDisabled();
    expect(screen.getByText(/device offline/i)).toBeInTheDocument();
  });
});
```

## Backend Testing Patterns

### Sensor Data Processing Tests

```typescript
import { Test, TestingModule } from "@nestjs/testing";
import { SensorService } from "./sensor.service";
import { PrismaService } from "../prisma.service";
import { WebSocketGateway } from "../websocket/websocket.gateway";

describe("SensorService", () => {
  let service: SensorService;
  let prismaService: PrismaService;
  let websocketGateway: WebSocketGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SensorService,
        {
          provide: PrismaService,
          useValue: {
            sensorReading: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: WebSocketGateway,
          useValue: {
            emitSensorUpdate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SensorService>(SensorService);
    prismaService = module.get<PrismaService>(PrismaService);
    websocketGateway = module.get<WebSocketGateway>(WebSocketGateway);
  });

  it("should process and store sensor data", async () => {
    const sensorData = {
      deviceId: "esp32-001",
      sensorId: "temp-sensor-1",
      sensorType: "temperature",
      value: 22.5,
      unit: "°C",
      timestamp: new Date().toISOString(),
    };

    const mockStoredData = { id: "1", ...sensorData };
    jest
      .spyOn(prismaService.sensorReading, "create")
      .mockResolvedValue(mockStoredData);

    const result = await service.processSensorData(sensorData);

    expect(prismaService.sensorReading.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        value: 22.5,
        sensorType: "temperature",
      }),
    });

    expect(websocketGateway.emitSensorUpdate).toHaveBeenCalledWith(
      mockStoredData
    );
    expect(result).toEqual(mockStoredData);
  });

  it("should validate sensor data and reject invalid readings", async () => {
    const invalidSensorData = {
      deviceId: "esp32-001",
      sensorId: "temp-sensor-1",
      sensorType: "temperature",
      value: 150, // Invalid temperature
      unit: "°C",
      timestamp: new Date().toISOString(),
    };

    await expect(service.processSensorData(invalidSensorData)).rejects.toThrow(
      "Invalid sensor reading: temperature out of range"
    );
  });
});
```

### Automation System Tests

```typescript
describe("AutomationService", () => {
  let service: AutomationService;
  let deviceService: DeviceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutomationService,
        {
          provide: DeviceService,
          useValue: {
            sendCommand: jest.fn().mockResolvedValue({ success: true }),
          },
        },
      ],
    }).compile();

    service = module.get<AutomationService>(AutomationService);
    deviceService = module.get<DeviceService>(DeviceService);
  });

  it("should trigger automation when conditions are met", async () => {
    const sensorData = {
      sensorId: "soil-moisture-1",
      value: 15, // Low soil moisture
      timestamp: new Date(),
    };

    const automation = {
      id: "auto-1",
      condition: {
        sensorId: "soil-moisture-1",
        operator: "less_than",
        value: 20,
      },
      actions: [
        {
          deviceId: "esp32-001",
          actuatorId: "water-pump-1",
          command: "on",
          duration: 30000, // 30 seconds
        },
      ],
    };

    jest.spyOn(service, "getActiveAutomations").mockResolvedValue([automation]);

    await service.checkTriggers(sensorData);

    expect(deviceService.sendCommand).toHaveBeenCalledWith("esp32-001", {
      actuatorId: "water-pump-1",
      command: "on",
      duration: 30000,
    });
  });

  it("should not trigger automation if conditions are not met", async () => {
    const sensorData = {
      sensorId: "soil-moisture-1",
      value: 35, // Adequate soil moisture
      timestamp: new Date(),
    };

    const automation = {
      condition: {
        sensorId: "soil-moisture-1",
        operator: "less_than",
        value: 20,
      },
      actions: [],
    };

    jest.spyOn(service, "getActiveAutomations").mockResolvedValue([automation]);

    await service.checkTriggers(sensorData);

    expect(deviceService.sendCommand).not.toHaveBeenCalled();
  });
});
```

### WebSocket Gateway Tests

```typescript
describe("GreenhouseGateway", () => {
  let gateway: GreenhouseGateway;
  let mockClient: any;

  beforeEach(async () => {
    mockClient = {
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [GreenhouseGateway],
    }).compile();

    gateway = module.get<GreenhouseGateway>(GreenhouseGateway);
  });

  it("should handle sensor subscription", async () => {
    const result = await gateway.handleSensorSubscription(
      mockClient,
      "sensor-1"
    );

    expect(mockClient.join).toHaveBeenCalledWith("sensor-sensor-1");
    expect(result).toEqual({ status: "subscribed", sensorId: "sensor-1" });
  });

  it("should broadcast sensor updates to subscribed clients", () => {
    const sensorData = {
      id: "1",
      sensorId: "sensor-1",
      value: 22.5,
      timestamp: new Date(),
    };

    gateway.server = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;

    gateway.emitSensorUpdate(sensorData);

    expect(gateway.server.to).toHaveBeenCalledWith("sensor-sensor-1");
    expect(gateway.server.emit).toHaveBeenCalledWith(
      "sensor-update",
      sensorData
    );
  });
});
```

## Hardware Testing (ESP32)

### Sensor Reading Tests

```cpp
#include <unity.h>
#include "SensorManager.h"
#include "MockSensor.h"

void setUp(void) {
    // Initialize test environment
}

void tearDown(void) {
    // Clean up
}

void test_temperature_sensor_reading() {
    SensorManager sensorManager;
    MockTemperatureSensor mockSensor;

    // Set expected temperature
    mockSensor.setTemperature(25.5);

    float reading = sensorManager.readTemperature(&mockSensor);

    TEST_ASSERT_FLOAT_WITHIN(0.1, 25.5, reading);
}

void test_sensor_calibration() {
    SensorManager sensorManager;
    TemperatureSensor sensor;

    // Test calibration with known reference values
    float rawValue = 512.0; // ADC reading
    float expectedTemp = 25.0;

    sensor.calibrate(rawValue, expectedTemp);
    float calibratedReading = sensor.convertToTemperature(rawValue);

    TEST_ASSERT_FLOAT_WITHIN(0.5, expectedTemp, calibratedReading);
}

void test_communication_protocol() {
    WiFiManager wifiManager;
    APIClient apiClient;

    // Mock successful connection
    wifiManager.connect("TestNetwork", "password");
    TEST_ASSERT_TRUE(wifiManager.isConnected());

    // Test data transmission
    SensorData data = {
        .sensorId = "temp-001",
        .value = 25.5,
        .timestamp = millis()
    };

    bool success = apiClient.sendSensorData(data);
    TEST_ASSERT_TRUE(success);
}

int main() {
    UNITY_BEGIN();

    RUN_TEST(test_temperature_sensor_reading);
    RUN_TEST(test_sensor_calibration);
    RUN_TEST(test_communication_protocol);

    return UNITY_END();
}
```

## AI/ML Testing (Python)

### Model Performance Tests

```python
import pytest
import numpy as np
from models.lstm_model import EnvironmentPredictor
from data_processing.preprocessor import DataPreprocessor

class TestEnvironmentPredictor:
    def setup_method(self):
        self.model = EnvironmentPredictor()
        self.preprocessor = DataPreprocessor()

    def test_model_prediction_accuracy(self):
        # Load test dataset
        test_data = self.load_test_data()
        X_test, y_test = self.preprocessor.prepare_data(test_data)

        # Make predictions
        predictions = self.model.predict(X_test)

        # Calculate accuracy metrics
        mae = np.mean(np.abs(predictions - y_test))
        mse = np.mean((predictions - y_test) ** 2)

        # Assert accuracy thresholds
        assert mae < 2.0, f"Mean Absolute Error {mae} exceeds threshold"
        assert mse < 5.0, f"Mean Squared Error {mse} exceeds threshold"

    def test_data_preprocessing(self):
        raw_data = [
            {"temperature": 25.5, "humidity": 60.0, "timestamp": "2024-01-01T10:00:00Z"},
            {"temperature": 26.0, "humidity": 58.0, "timestamp": "2024-01-01T11:00:00Z"},
        ]

        processed_data = self.preprocessor.process(raw_data)

        assert len(processed_data) == 2
        assert "temperature_normalized" in processed_data[0]
        assert "humidity_normalized" in processed_data[0]

    def test_anomaly_detection(self):
        normal_data = np.array([[25.0, 60.0], [24.5, 62.0], [26.0, 58.0]])
        anomaly_data = np.array([[45.0, 90.0]])  # Unusual values

        normal_scores = self.model.anomaly_score(normal_data)
        anomaly_scores = self.model.anomaly_score(anomaly_data)

        assert np.max(normal_scores) < 0.7, "Normal data flagged as anomaly"
        assert np.min(anomaly_scores) > 0.8, "Anomaly not detected"

    def load_test_data(self):
        # Load or generate test data
        return np.random.rand(100, 5)  # Mock data for testing
```

## Integration Testing Strategy

### End-to-End Automation Tests

```typescript
import { test, expect } from "@playwright/test";

test.describe("Greenhouse Automation Flow", () => {
  test("should trigger watering automation based on soil moisture", async ({
    page,
  }) => {
    // Navigate to dashboard
    await page.goto("/dashboard");

    // Check initial soil moisture
    const soilMoisture = page.locator('[data-testid="soil-moisture-sensor"]');
    await expect(soilMoisture).toBeVisible();

    // Simulate low soil moisture reading
    await page.evaluate(() => {
      window.mockSensorData({
        sensorId: "soil-moisture-1",
        value: 15, // Below threshold
        timestamp: new Date().toISOString(),
      });
    });

    // Wait for automation to trigger
    await page.waitForTimeout(2000);

    // Verify water pump activation
    const waterPump = page.locator('[data-testid="water-pump-status"]');
    await expect(waterPump).toHaveText("ON");

    // Check notification
    const notification = page.locator(
      '[data-testid="automation-notification"]'
    );
    await expect(notification).toContainText("Watering started");
  });

  test("should send alerts for critical sensor failures", async ({ page }) => {
    await page.goto("/dashboard");

    // Simulate sensor offline
    await page.evaluate(() => {
      window.mockSensorStatus({
        sensorId: "temp-sensor-1",
        status: "offline",
      });
    });

    // Check alert display
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("Temperature sensor offline");

    // Verify alert persistence
    await page.reload();
    await expect(alert).toBeVisible();
  });
});
```

## Test Coverage Requirements

### Coverage Targets

- **Frontend Components**: 85% minimum coverage
- **Backend Services**: 90% minimum coverage
- **API Endpoints**: 100% coverage for all routes
- **Hardware Functions**: 80% minimum coverage
- **AI/ML Models**: 85% minimum coverage for core algorithms

### Quality Gates

- All tests must pass before merge
- Coverage thresholds enforced in CI/CD
- Performance tests for real-time features
- Security tests for device authentication
- Load tests for concurrent sensor data processing

This comprehensive testing strategy ensures reliability, performance, and security across all components of the IoT greenhouse system.
