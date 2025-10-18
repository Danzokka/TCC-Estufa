# Copilot Instructions - TCC Estufa Inteligente

## Project Overview

This is an **IoT Smart Greenhouse** system combining hardware sensors (ESP32), backend API (NestJS), frontend web app (Next.js PWA), and AI/ML analysis (Python). The system monitors environmental conditions and controls actuators in real-time.

Always use TODOs for planning and tasking everywhere in the codebase for every prompt and request.

### Architecture (4-Tier IoT Stack)

```
ESP32 (C++) → NestJS API (TypeScript) → PostgreSQL
                ↓
         Next.js PWA (TypeScript)
                ↓
         Python AI Service (Flask)
```

## Critical Knowledge

### 1. Monorepo Structure (Turborepo + pnpm)

- **`apps/api`**: NestJS backend with Prisma ORM
- **`apps/web`**: Next.js 15 App Router PWA
- **`apps/esp`**: PlatformIO C++ firmware for ESP32
- **`apps/ai`**: Python Flask API for ML predictions
- **`packages/`**: Shared configs (ESLint, TypeScript, UI components)

**Build Commands:**

```bash
pnpm dev          # Start all services in dev mode
pnpm build        # Build all apps
turbo run dev     # Runs dev with dependency graph
```

### 2. ESP32 ↔ API Communication Pattern

**ESP32 Side** (`apps/esp/lib/SERVER/SERVER.cpp`):

- Collects sensor data every 1 second using **FreeRTOS dual-core tasks**
- Core 0: Sensor reading & HTTP POST to API
- Core 1: OLED display updates
- Sends **averaged readings** every 30 seconds to `/sensor/sendData`
- Uses mutex (`sensorMutex`) for shared data between tasks

**API Side** (`apps/api/src/sensor/sensor.service.ts`):

```typescript
async sendData(data: CreateSensorDataDto) {
  const sensorData = await this.prisma.sensor.create({
    data: {
      air_temperature: data.air_temperature,
      air_humidity: data.air_humidity,
      soil_temperature: data.soil_temperature,
      soil_moisture: data.soil_moisture,
      light_intensity: data.light_intensity,
      water_level: data.water_level,
      water_reserve: data.water_reserve,
      userPlantId: data.userPlant, // Links sensor data to user's plant
    },
  });
}
```

### 3. Database Schema (Prisma + PostgreSQL)

**Core Models:**

- `User` → has many `UserPlant` (user's greenhouse plants)
- `Plant` → template with ideal environmental ranges
- `UserPlant` → junction table linking User + Plant
- `Sensor` → time-series data (foreign key to `UserPlantId`)
- `Greenhouse` → location container for multiple plants
- `BlogPost`, `Comment`, `Like` → content management

**Key Pattern:** Sensor readings are **always linked to a specific UserPlant**, not directly to User or Plant.

### 4. NestJS Module Architecture

Modules are **domain-driven** with guards and DTOs:

```typescript
@Module({
  imports: [SensorModule, UserModule, PlantModule, AuthModule, PumpModule, GreenhouseModule],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard }, // Rate limiting
  ],
})
```

**Security Layers:**

1. Helmet for HTTP headers
2. CORS restricted to `FRONTEND_URL` (port 3000)
3. JWT Bearer auth (`@nestjs/jwt`)
4. Global validation pipes (`class-validator`)
5. Three-tier throttling (1s, 10s, 60s)

### 5. Frontend Patterns (Next.js App Router)

**Directory Structure:**

- `(auth)/` - Route group for auth pages (login, register)
- `dashboard/` - Main monitoring interface
- `pump/` - Actuator control
- `profile/` - User settings

**Key Hooks:**

- `useDeviceConfig` - Fetches ESP32 configuration from API
- `useCaptcha` - Custom CAPTCHA validation for auth
- `useIsMobile` - Responsive design helper

**Styling:** Tailwind CSS with dark/light theme via `ThemeProvider`

### 6. Python AI Service Integration

**Entry Point:** `apps/ai/main.py`

- `--train`: Train initial LSTM models
- `--analyze`: Run one-time analysis
- Default: Start Flask API server

**Architecture:**

- `models/lstm_model.py` - PyTorch LSTM for time-series prediction
- `data_processing/preprocessor.py` - Feature engineering
- `analysis/insights_generator.py` - Recommendations
- `db/database.py` - PostgreSQL connection (SQLAlchemy)

**Data Flow:** API → Postgres ← Python (reads sensor data, generates insights)

### 7. Development Workflow

**Local Development:**

```bash
# Start infrastructure
docker-compose up -d db  # PostgreSQL on port 5432

# API setup
cd apps/api
pnpm install
npx prisma migrate dev   # Apply migrations
npx prisma generate      # Generate Prisma client
pnpm dev                 # Starts on port 5000

# Frontend
cd apps/web
pnpm dev                 # Starts on port 3000

# Python AI
cd apps/ai
pip install -r requirements.txt
python main.py           # Starts Flask on port 8080
```

**ESP32 Development:**

```bash
cd apps/esp
pio run          # Compile firmware
pio run -t upload  # Flash to ESP32
pio device monitor # Serial console
```

### 8. Critical Configuration Files

**Environment Variables:**

- `apps/api/.env`: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`
- `apps/ai/.env`: `DATABASE_URL` (connects to same Postgres)
- `apps/esp/lib/SERVER/SERVER.h`: WiFi credentials, API endpoint URL

**Migrations:**

- Located in `apps/api/prisma/migrations/`
- Generated via `npx prisma migrate dev --name <description>`
- **Never** edit migration files manually

### 9. Testing Strategy

**API Tests:**

- `apps/api/test/` - E2E tests with Jest
- Run: `pnpm test` or `pnpm test:e2e`

**ESP32 Tests:**

- `apps/esp/test/` - Native tests (PlatformIO)
- Run: `pio test`

**Frontend:**

- Jest config in `apps/web/jest.config.js`
- Setup in `apps/web/jest.setup.js`

### 10. Pump Control Flow (Real Actuator Example)

**Web UI** (`apps/web/src/app/pump/page.tsx`):

```tsx
// User clicks "Activate Pump" button
POST /pump/activate
{
  greenhouseId: "uuid",
  duration: 30,  // seconds
  mode: "time-based"
}
```

**API** (`apps/api/src/pump/pump.controller.ts`):

- Validates request with DTOs
- Records pump activation in database
- **TODO:** Send command back to ESP32 via WebSocket/MQTT

**ESP32** (`apps/esp/lib/PUMP/PUMP.cpp`):

- Receives command from API
- Activates relay pin for specified duration
- Monitors water flow sensor
- Sends status updates back to API

### 11. Common Pitfalls & Solutions

❌ **"Prisma Client not found"**
→ Run `npx prisma generate` in `apps/api`

❌ **CORS errors from ESP32**
→ Add ESP32 IP to `main.ts` CORS origins

❌ **Port conflicts**
→ Ensure Postgres (5432), API (5000), Web (3000) are free

❌ **ESP32 WiFi not connecting**
→ Check `SERVER.h` SSID/password, verify 2.4GHz network

❌ **Type errors in Turbo builds**
→ Run `pnpm check-types` to find issues across workspace

### 12. Code Style Conventions

**TypeScript:**

- Use async/await (no `.then()` chains)
- DTOs with `class-validator` decorators
- Services use dependency injection

**C++ (ESP32):**

- FreeRTOS tasks for concurrency
- Mutex protection for shared variables
- Serial logging for debugging

**Python:**

- Type hints preferred
- Pandas for data manipulation
- PyTorch for ML models

## Quick Reference

| Task           | Command                                 |
| -------------- | --------------------------------------- |
| Install deps   | `pnpm install`                          |
| Start dev      | `pnpm dev`                              |
| Build all      | `pnpm build`                            |
| API migrations | `cd apps/api && npx prisma migrate dev` |
| ESP32 flash    | `cd apps/esp && pio run -t upload`      |
| Python AI      | `cd apps/ai && python main.py`          |

## Additional Resources

- **Prisma Schema:** `apps/api/prisma/schema.prisma`
- **API Swagger:** `http://localhost:5000/api` (when running)
- **Docker Compose:** `docker-compose.yml` (Postgres setup)
- **PlatformIO Config:** `apps/esp/platformio.ini`
