---
applyTo: "**/*.{md,mdx,rst,txt,json,yaml,yml}"
---

# Documentation Best Practices Guidelines

## Overview

Comprehensive documentation is crucial for the success and maintainability of the IoT Greenhouse System. This guide establishes standards for creating, maintaining, and organizing documentation across all project components.

## Documentation Philosophy

### Core Principles

1. **User-Centric**: Write for your audience (developers, users, maintainers)
2. **Actionable**: Provide clear, step-by-step instructions
3. **Searchable**: Use clear headings, keywords, and structure
4. **Maintainable**: Keep documentation close to code and update regularly
5. **Accessible**: Use inclusive language and consider different skill levels

### Documentation Types

- **README**: Project overview and quick start
- **API Documentation**: Endpoint descriptions and examples
- **User Guides**: Step-by-step usage instructions
- **Developer Guides**: Setup, architecture, and contribution guidelines
- **Architecture Documentation**: System design and technical decisions
- **Troubleshooting Guides**: Common issues and solutions
- **Changelog**: Version history and breaking changes

## File Structure & Organization

### Recommended Directory Structure

```
docs/
├── README.md                 # Main project documentation
├── CONTRIBUTING.md           # Contribution guidelines
├── CHANGELOG.md             # Version history
├── LICENSE.md               # Project license
├── api/
│   ├── README.md            # API overview
│   ├── authentication.md   # Auth documentation
│   ├── endpoints/           # Endpoint documentation
│   └── examples/            # API usage examples
├── user-guide/
│   ├── README.md            # User guide overview
│   ├── installation.md     # Installation instructions
│   ├── configuration.md    # Configuration guide
│   └── troubleshooting.md  # Common issues
├── developer-guide/
│   ├── README.md            # Developer overview
│   ├── getting-started.md  # Development setup
│   ├── architecture.md     # System architecture
│   ├── testing.md          # Testing guidelines
│   └── deployment.md       # Deployment guide
├── hardware/
│   ├── README.md            # Hardware overview
│   ├── esp32-setup.md      # ESP32 configuration
│   ├── sensors.md          # Sensor documentation
│   └── wiring-diagrams/    # Hardware diagrams
├── ai-ml/
│   ├── README.md            # AI/ML overview
│   ├── models.md           # Model documentation
│   ├── data-processing.md  # Data pipeline docs
│   └── training.md         # Training procedures
└── assets/
    ├── images/             # Documentation images
    ├── diagrams/           # Architecture diagrams
    └── videos/             # Tutorial videos
```

## Writing Standards

### Markdown Best Practices

#### Headers and Structure

```markdown
# Main Title (H1) - Use only once per document

## Major Section (H2)

### Subsection (H3)

#### Detail Section (H4)

##### Minor Section (H5)

###### Rare Use Section (H6)
```

#### Code Documentation

**Inline Code**: Use `backticks` for inline code, commands, file names, and technical terms.

**Code Blocks**: Use fenced code blocks with language specification:

```typescript
// TypeScript example
interface SensorData {
  temperature: number;
  humidity: number;
  timestamp: Date;
}

const readSensor = async (): Promise<SensorData> => {
  // Implementation here
  return {
    temperature: 25.5,
    humidity: 60.2,
    timestamp: new Date(),
  };
};
```

```python
# Python example
from dataclasses import dataclass
from datetime import datetime

@dataclass
class SensorReading:
    temperature: float
    humidity: float
    timestamp: datetime

def process_sensor_data(reading: SensorReading) -> dict:
    """Process sensor reading and return formatted data."""
    return {
        "temp_celsius": reading.temperature,
        "humidity_percent": reading.humidity,
        "reading_time": reading.timestamp.isoformat()
    }
```

```cpp
// C++ example for ESP32
#include <Arduino.h>
#include <DHT.h>

class SensorManager {
private:
    DHT dht;

public:
    SensorManager(uint8_t pin, uint8_t type) : dht(pin, type) {}

    bool initialize() {
        dht.begin();
        return true;
    }

    float readTemperature() {
        return dht.readTemperature();
    }
};
```

#### Links and References

**Internal Links**: Use relative paths for internal documentation:

```markdown
See the [API Documentation](./api/README.md) for details.
```

**External Links**: Include descriptive text:

```markdown
Learn more about [Next.js App Router](https://nextjs.org/docs/app) in the official documentation.
```

**Reference-style Links**: For better readability in long documents:

```markdown
The system uses [PyTorch][pytorch] for machine learning and [NestJS][nestjs] for the backend API.

[pytorch]: https://pytorch.org/
[nestjs]: https://nestjs.com/
```

#### Lists and Tables

**Unordered Lists**: Use consistent bullet style:

```markdown
- Primary item
  - Sub-item with 2-space indentation
  - Another sub-item
- Another primary item
```

**Ordered Lists**: Use for sequential steps:

```markdown
1. First step in the process
2. Second step with important details
3. Final step to complete the task
```

**Tables**: Use for structured data:

```markdown
| Component  | Technology | Purpose                      |
| ---------- | ---------- | ---------------------------- |
| Frontend   | Next.js 15 | User interface and PWA       |
| Backend    | NestJS     | API and business logic       |
| Database   | PostgreSQL | Data persistence             |
| AI Service | PyTorch    | Machine learning predictions |
| IoT Device | ESP32      | Sensor data collection       |
```

### Content Guidelines

#### Writing Style

1. **Use Active Voice**: "Configure the sensor" instead of "The sensor should be configured"
2. **Be Concise**: Eliminate unnecessary words and jargon
3. **Use Present Tense**: "The system processes data" not "The system will process data"
4. **Be Specific**: Use exact version numbers, file paths, and commands
5. **Include Context**: Explain why something is important, not just how to do it

#### Code Documentation

**Function Documentation**: Use consistent docstring format:

````typescript
/**
 * Processes sensor data and returns health score prediction
 *
 * @param sensorData - Raw sensor readings from ESP32 device
 * @param plantType - Type of plant being monitored
 * @param historicalData - Previous readings for trend analysis
 * @returns Promise resolving to health score (0-100) and recommendations
 *
 * @example
 * ```typescript
 * const result = await predictPlantHealth(
 *   { temperature: 25.5, humidity: 60.2 },
 *   'tomato',
 *   previousReadings
 * );
 * console.log(`Health Score: ${result.healthScore}`);
 * ```
 *
 * @throws {ValidationError} When sensor data is invalid
 * @throws {APIError} When prediction service is unavailable
 */
async function predictPlantHealth(
  sensorData: SensorData,
  plantType: PlantType,
  historicalData: HistoricalData[]
): Promise<HealthPrediction> {
  // Implementation
}
````

```python
def train_lstm_model(data: pd.DataFrame, config: ModelConfig) -> torch.nn.Module:
    """
    Train LSTM model for time series prediction of plant health.

    Args:
        data: Preprocessed sensor data with columns ['temperature', 'humidity', 'soil_moisture']
        config: Model configuration including hidden_size, num_layers, learning_rate

    Returns:
        Trained PyTorch LSTM model ready for inference

    Raises:
        ValueError: If data is empty or missing required columns
        RuntimeError: If training fails due to hardware constraints

    Example:
        >>> config = ModelConfig(hidden_size=64, num_layers=2, learning_rate=0.001)
        >>> model = train_lstm_model(sensor_data, config)
        >>> prediction = model(new_sensor_readings)

    Note:
        Model training requires GPU with at least 4GB memory for optimal performance.
        Training time varies from 10-60 minutes depending on dataset size.
    """
    # Implementation
```

```cpp
/**
 * @brief Reads temperature and humidity from DHT22 sensor
 *
 * This function performs multiple readings and averages them to improve accuracy.
 * It includes error handling for sensor communication failures.
 *
 * @param[out] temperature Pointer to store temperature reading in Celsius
 * @param[out] humidity Pointer to store humidity reading as percentage
 * @param[in] samples Number of samples to average (default: 3)
 *
 * @return true if reading successful, false if sensor error
 *
 * @warning Function blocks for approximately (samples * 100ms) during execution
 *
 * @example
 * @code
 * float temp, humid;
 * if (readTempHumidity(&temp, &humid)) {
 *     Serial.printf("Temperature: %.1f°C, Humidity: %.1f%%\n", temp, humid);
 * } else {
 *     Serial.println("Sensor reading failed!");
 * }
 * @endcode
 */
bool readTempHumidity(float* temperature, float* humidity, uint8_t samples = 3);
```

## API Documentation Standards

### OpenAPI/Swagger Documentation

Use comprehensive OpenAPI specifications for REST APIs:

```yaml
# apps/api/swagger.yaml
openapi: 3.0.3
info:
  title: IoT Greenhouse API
  description: |
    REST API for the IoT Greenhouse Management System

    ## Authentication
    All endpoints require JWT authentication via Bearer token.

    ## Rate Limiting
    API is rate-limited to 1000 requests per hour per API key.

    ## Error Handling
    All errors return RFC 7807 compliant error responses.
  version: 1.0.0
  contact:
    name: Development Team
    email: dev@greenhouse.local
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.greenhouse.local/v1
    description: Production server
  - url: https://staging-api.greenhouse.local/v1
    description: Staging server
  - url: http://localhost:5000/v1
    description: Development server

paths:
  /sensors/data:
    post:
      summary: Submit sensor data reading
      description: |
        Accepts sensor data from ESP32 devices and processes it for storage and analysis.

        The endpoint validates sensor data, performs basic anomaly detection,
        and triggers ML predictions for plant health assessment.
      tags:
        - Sensors
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/SensorDataRequest"
            examples:
              typical_reading:
                summary: Typical greenhouse reading
                value:
                  deviceId: "greenhouse-esp32-001"
                  timestamp: "2024-01-15T10:30:00Z"
                  temperature: 25.5
                  humidity: 62.3
                  soilMoisture: 45.8
                  lightIntensity: 850
                  plantId: "tomato-plant-01"
      responses:
        "201":
          description: Sensor data processed successfully
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SensorDataResponse"
        "400":
          description: Invalid sensor data
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ErrorResponse"
        "401":
          description: Authentication required
        "422":
          description: Validation failed
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ValidationErrorResponse"

components:
  schemas:
    SensorDataRequest:
      type: object
      required:
        - deviceId
        - timestamp
        - temperature
        - humidity
      properties:
        deviceId:
          type: string
          description: Unique identifier for the ESP32 device
          example: "greenhouse-esp32-001"
          pattern: "^greenhouse-esp32-[0-9]{3}$"
        timestamp:
          type: string
          format: date-time
          description: ISO 8601 timestamp of the reading
        temperature:
          type: number
          format: float
          description: Temperature in Celsius
          minimum: -10
          maximum: 50
          example: 25.5
        humidity:
          type: number
          format: float
          description: Relative humidity percentage
          minimum: 0
          maximum: 100
          example: 62.3
        soilMoisture:
          type: number
          format: float
          description: Soil moisture percentage
          minimum: 0
          maximum: 100
          example: 45.8
        lightIntensity:
          type: number
          format: float
          description: Light intensity in lux
          minimum: 0
          example: 850
        plantId:
          type: string
          description: Optional plant identifier
          example: "tomato-plant-01"

  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

### Endpoint Documentation Template

For each API endpoint, include:

````markdown
## POST /api/sensors/data

### Description

Submits sensor data from ESP32 devices for processing and analysis.

### Authentication

Requires valid JWT token in Authorization header.

### Request

- **Content-Type**: `application/json`
- **Body**: [SensorDataRequest](#sensordatarequest)

### Response

- **Status**: `201 Created`
- **Content-Type**: `application/json`
- **Body**: [SensorDataResponse](#sensordataresponse)

### Example Request

```bash
curl -X POST https://api.greenhouse.local/v1/sensors/data \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "greenhouse-esp32-001",
    "timestamp": "2024-01-15T10:30:00Z",
    "temperature": 25.5,
    "humidity": 62.3,
    "soilMoisture": 45.8,
    "lightIntensity": 850,
    "plantId": "tomato-plant-01"
  }'
```
````

### Example Response

```json
{
  "id": "reading-12345",
  "status": "processed",
  "healthScore": 85,
  "recommendations": ["Increase watering frequency", "Monitor light exposure"],
  "processedAt": "2024-01-15T10:30:05Z"
}
```

### Error Responses

#### 400 Bad Request

```json
{
  "error": "INVALID_SENSOR_DATA",
  "message": "Temperature value out of valid range",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 422 Validation Error

```json
{
  "error": "VALIDATION_FAILED",
  "message": "Request validation failed",
  "details": [
    {
      "field": "temperature",
      "message": "must be between -10 and 50"
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

````

## Architecture Documentation

### System Architecture Diagrams

Use Mermaid for inline diagrams:

```markdown
## System Architecture Overview

```mermaid
graph TB
    subgraph "IoT Layer"
        ESP32[ESP32 Device]
        Sensors[Sensor Array]
        ESP32 --> Sensors
    end

    subgraph "Application Layer"
        Frontend[Next.js Frontend]
        API[NestJS API]
        AI[Python AI Service]
        Frontend --> API
        API --> AI
    end

    subgraph "Data Layer"
        Database[(PostgreSQL)]
        Cache[(Redis Cache)]
        API --> Database
        API --> Cache
    end

    subgraph "Infrastructure"
        Docker[Docker Containers]
        CI[GitHub Actions]
        Monitoring[Grafana/Prometheus]
    end

    ESP32 -->|HTTPS/JSON| API
    AI --> Database

    style ESP32 fill:#e1f5fe
    style Frontend fill:#f3e5f5
    style API fill:#e8f5e8
    style AI fill:#fff3e0
    style Database fill:#fce4ec
````

### Component Interaction Flow

```mermaid
sequenceDiagram
    participant ESP32
    participant API
    participant AI
    participant DB
    participant Frontend

    ESP32->>+API: POST /sensors/data
    API->>+DB: Store sensor reading
    DB-->>-API: Confirm storage
    API->>+AI: Request health prediction
    AI->>+DB: Fetch historical data
    DB-->>-AI: Return data
    AI-->>-API: Return prediction
    API-->>-ESP32: Confirmation + recommendations

    Frontend->>+API: GET /dashboard/data
    API->>+DB: Query recent readings
    DB-->>-API: Return aggregated data
    API-->>-Frontend: Dashboard data
```

````

### Data Flow Documentation

```markdown
## Data Flow Architecture

### 1. Data Collection (ESP32 → API)
1. **Sensor Reading**: ESP32 reads from multiple sensors (DHT22, soil moisture, light)
2. **Data Validation**: Local validation of sensor ranges and data integrity
3. **Network Transmission**: HTTPS POST to API with JSON payload
4. **Authentication**: JWT token verification for device identity
5. **API Validation**: Server-side validation of data format and ranges

### 2. Data Processing (API → AI Service)
1. **Data Storage**: Raw sensor data stored in PostgreSQL
2. **Preprocessing**: Data cleaning and feature engineering
3. **ML Inference**: LSTM model prediction for plant health
4. **Result Storage**: Predictions and recommendations stored
5. **Real-time Updates**: WebSocket notifications to connected clients

### 3. Data Visualization (Frontend)
1. **Dashboard Queries**: Real-time data fetching via React Query
2. **Chart Rendering**: Time-series visualization with Recharts
3. **User Interactions**: Filter controls and date range selection
4. **Mobile Optimization**: PWA capabilities for mobile access
````

## User Guide Standards

### Installation Instructions Template

````markdown
# Installation Guide

## Prerequisites

Before installing the IoT Greenhouse System, ensure you have:

- **Hardware Requirements**:

  - ESP32 development board (ESP32-WROOM-32 recommended)
  - DHT22 temperature/humidity sensor
  - Soil moisture sensor
  - OLED display (128x64, I2C)
  - MicroSD card (8GB minimum)
  - Power supply (5V, 2A minimum)

- **Software Requirements**:

  - Node.js 18.0 or higher
  - Python 3.9 or higher
  - Docker and Docker Compose
  - Git

- **Knowledge Requirements**:
  - Basic command line usage
  - Understanding of IoT concepts
  - Familiarity with web interfaces

## Quick Start (5 minutes)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/TCC-Estufa.git
cd TCC-Estufa
```
````

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit configuration (use your preferred editor)
nano .env
```

### 3. Start Services

```bash
# Start all services with Docker
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 4. Access the Application

- **Web Interface**: http://localhost:3000
- **API Documentation**: http://localhost:5000/api
- **AI Service**: http://localhost:8000/docs

## Detailed Installation

### Frontend Setup (Next.js)

1. **Navigate to Frontend Directory**

   ```bash
   cd apps/web
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment**

   ```bash
   # Create environment file
   cp .env.example .env.local

   # Edit configuration
   nano .env.local
   ```

   Required environment variables:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8000
   NEXTAUTH_SECRET=your-secret-here
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

### Backend Setup (NestJS)

1. **Navigate to Backend Directory**

   ```bash
   cd apps/api
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Database Setup**

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma migrate dev

   # Seed database with sample data
   npx prisma db seed
   ```

4. **Configure Environment**

   ```bash
   cp .env.example .env
   ```

   Required environment variables:

   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/greenhouse"
   JWT_SECRET="your-jwt-secret"
   PORT=5000
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

### Troubleshooting Common Issues

#### Port Already in Use

If you encounter port conflicts:

```bash
# Find process using port 3000
lsof -i :3000

# Kill process (replace PID with actual process ID)
kill -9 PID
```

#### Database Connection Failed

1. Verify PostgreSQL is running:

   ```bash
   docker ps | grep postgres
   ```

2. Check database credentials in `.env` file
3. Test connection:
   ```bash
   npx prisma db pull
   ```

#### ESP32 Not Connecting

1. Verify WiFi credentials in ESP32 code
2. Check serial monitor for error messages:
   ```bash
   pio device monitor -p /dev/ttyUSB0 -b 115200
   ```
3. Reset ESP32 and check LED indicators

## Success Criteria

After successful installation, you should be able to:

- [ ] Access web interface at http://localhost:3000
- [ ] View API documentation at http://localhost:5000/api
- [ ] See real sensor data in dashboard
- [ ] ESP32 status LED shows connection (solid blue)
- [ ] No error messages in service logs

````

## Maintenance & Updates

### Documentation Lifecycle

1. **Creation**: Write documentation as you develop features
2. **Review**: Include documentation review in pull requests
3. **Testing**: Verify instructions work on clean environments
4. **Updates**: Update docs when code changes
5. **Archival**: Archive outdated documentation clearly

### Version Control for Documentation

```markdown
<!-- Version tracking in documentation files -->
---
version: 1.2.0
last_updated: 2024-01-15
reviewed_by: John Doe
next_review: 2024-04-15
---
````

### Documentation Automation

#### Automated API Documentation

```typescript
// Use decorators for automatic API doc generation
@ApiTags("sensors")
@Controller("sensors")
export class SensorController {
  @Post("data")
  @ApiOperation({ summary: "Submit sensor data reading" })
  @ApiResponse({ status: 201, description: "Data processed successfully" })
  @ApiResponse({ status: 400, description: "Invalid sensor data" })
  async submitSensorData(@Body() data: SensorDataDto) {
    // Implementation
  }
}
```

#### Generated Documentation Scripts

```bash
#!/bin/bash
# scripts/generate-docs.sh

echo "Generating documentation..."

# Generate API documentation
npm run docs:api

# Generate code documentation
npm run docs:code

# Generate architecture diagrams
npm run docs:diagrams

# Build documentation site
npm run docs:build

echo "Documentation generated successfully!"
```

## Quality Checklist

Before publishing documentation, ensure:

### Content Quality

- [ ] Clear, actionable instructions
- [ ] Proper grammar and spelling
- [ ] Consistent terminology
- [ ] Updated screenshots and examples
- [ ] Working code samples
- [ ] Proper error handling examples

### Structure Quality

- [ ] Logical information hierarchy
- [ ] Consistent formatting
- [ ] Proper heading structure
- [ ] Cross-references work correctly
- [ ] Table of contents (for long docs)

### Technical Quality

- [ ] Code examples are tested
- [ ] Links are valid and current
- [ ] Images load properly
- [ ] Mobile-friendly formatting
- [ ] Accessibility considerations

### Maintenance Quality

- [ ] Version information included
- [ ] Last updated date current
- [ ] Contact information provided
- [ ] Feedback mechanism available
- [ ] Regular review schedule set

## Documentation Tools & Automation

### Recommended Tools

- **Writing**: VS Code with Markdown extensions
- **Diagrams**: Mermaid, draw.io, Lucidchart
- **API Docs**: Swagger/OpenAPI, Postman
- **Screenshots**: LightShot, Greenshot
- **Video**: OBS Studio, Loom
- **Site Generation**: Docusaurus, GitBook, VitePress

### CI/CD Integration

```yaml
# .github/workflows/docs.yml
name: Documentation

on:
  push:
    paths:
      - "docs/**"
      - "*.md"
  pull_request:
    paths:
      - "docs/**"
      - "*.md"

jobs:
  lint-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Lint Markdown
        uses: DavidAnson/markdownlint-cli2-action@v13
        with:
          globs: "**/*.md"

      - name: Check Links
        uses: gaurav-nelson/github-action-markdown-link-check@v1
        with:
          use-quiet-mode: "yes"
          use-verbose-mode: "yes"

  build-docs:
    runs-on: ubuntu-latest
    needs: lint-docs
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm install

      - name: Build documentation
        run: npm run docs:build

      - name: Deploy to GitHub Pages
        if: github.ref == 'refs/heads/main'
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs/dist
```

This comprehensive documentation guide ensures consistent, high-quality documentation across all aspects of the IoT Greenhouse System project.
