---
applyTo: "apps/api/**/*.{ts,js}"
---

# Backend Development Guidelines - IoT Greenhouse API

## Links

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT Documentation](https://jwt.io/introduction)
- [WebSocket Documentation](https://docs.nestjs.com/websockets/gateways)
- [MQTT Documentation](https://mqtt.org/mqtt-specification/)
- [Class Validator Documentation](https://github.com/typestack/class-validator)

## Tech Stack

- NestJS with TypeScript for robust API architecture
- Prisma ORM with PostgreSQL for data persistence
- JWT for authentication and API key management
- WebSocket Gateway for real-time sensor data
- MQTT Client for ESP32 device communication
- Class-validator for comprehensive data validation
- Jest for unit and integration testing
- Docker for containerized deployment

## Project Architecture

This is the IoT Greenhouse API backend providing:

- **Device Management**: ESP32 registration, authentication, and communication
- **Real-time Data**: WebSocket connections for live sensor readings
- **Automation Control**: Threshold-based and scheduled automation systems
- **User Management**: Role-based access control for greenhouse operations
- **Data Analytics**: Time-series data processing and insights
- **Alert System**: Threshold monitoring and notification management
- **Blog/Content**: Documentation and knowledge sharing system

## Module Architecture & Patterns

### Core Module Structure

```
apps/api/src/
├── main.ts                 # Application bootstrap
├── app.module.ts          # Root module
├── prisma.service.ts      # Database service
├── auth/                  # Authentication & authorization
├── user/                  # User management
├── greenhouse/            # Greenhouse operations
├── plant/                 # Plant monitoring & management
├── sensor/                # Sensor data & management
├── automation/            # Automation rules & execution
├── alert/                 # Alert system & notifications
├── blog/                  # Content management
├── device/                # ESP32 device management
├── websocket/             # Real-time WebSocket gateway
├── mqtt/                  # MQTT broker integration
└── common/                # Shared utilities & guards
    ├── guards/            # Authentication & authorization guards
    ├── decorators/        # Custom decorators
    ├── interceptors/      # Request/response interceptors
    └── pipes/             # Validation & transformation pipes
```

### IoT-Specific Modules

#### Device Module

Manages ESP32 devices, authentication, and configuration:

```typescript
@Module({
  imports: [PrismaModule],
  controllers: [DeviceController],
  providers: [DeviceService, DeviceAuthGuard],
  exports: [DeviceService],
})
export class DeviceModule {}
```

#### Sensor Module

Handles sensor data collection, validation, and storage:

```typescript
@Injectable()
export class SensorService {
  async receiveSensorData(deviceId: string, sensorData: SensorDataDto) {
    // Validate sensor readings
    // Store time-series data
    // Trigger real-time updates
    // Check automation thresholds
  }
}
```

#### WebSocket Gateway

Provides real-time data streaming to frontend clients:

```typescript
@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL },
  namespace: "greenhouse",
})
export class GreenhouseGateway {
  @SubscribeMessage("subscribe-sensor")
  handleSensorSubscription(client: Socket, sensorId: string) {
    // Handle real-time sensor subscriptions
  }
}
```

### Controllers Best Practices

#### IoT Data Endpoints

```typescript
@Controller("sensors")
@UseGuards(AuthGuard)
export class SensorController {
  // Device endpoint for ESP32 data submission
  @Post("data")
  @UseGuards(DeviceAuthGuard)
  async receiveSensorData(@Body() data: SensorDataDto) {
    return this.sensorService.processSensorData(data);
  }

  // User endpoint for historical data
  @Get(":id/history")
  async getSensorHistory(
    @Param("id") sensorId: string,
    @Query() query: TimeRangeQueryDto
  ) {
    return this.sensorService.getHistoricalData(sensorId, query);
  }

  // Real-time sensor status
  @Get(":id/status")
  async getSensorStatus(@Param("id") sensorId: string) {
    return this.sensorService.getCurrentStatus(sensorId);
  }
}
```

#### Automation Control

```typescript
@Controller("automation")
@UseGuards(AuthGuard)
export class AutomationController {
  @Post("trigger/:id")
  @UseGuards(AdminGuard) // Only admins can manually trigger
  async triggerAutomation(@Param("id") automationId: string) {
    return this.automationService.executeAutomation(automationId);
  }

  @Put(":id/schedule")
  async updateSchedule(
    @Param("id") automationId: string,
    @Body() schedule: ScheduleDto
  ) {
    return this.automationService.updateSchedule(automationId, schedule);
  }
}
```

### Services Architecture

#### Data Processing Service

```typescript
@Injectable()
export class SensorDataService {
  constructor(
    private prisma: PrismaService,
    private websocketGateway: GreenhouseGateway,
    private automationService: AutomationService,
    private alertService: AlertService
  ) {}

  async processSensorData(data: SensorDataDto) {
    // 1. Validate sensor data
    const validatedData = await this.validateSensorReading(data);

    // 2. Store in time-series format
    const stored = await this.storeSensorData(validatedData);

    // 3. Emit real-time updates
    this.websocketGateway.emitSensorUpdate(stored);

    // 4. Check automation triggers
    await this.automationService.checkTriggers(stored);

    // 5. Evaluate alert conditions
    await this.alertService.evaluateThresholds(stored);

    return stored;
  }
}
```

#### Automation Service

```typescript
@Injectable()
export class AutomationService {
  async checkTriggers(sensorData: SensorData) {
    const automations = await this.getActiveAutomations(sensorData.sensorId);

    for (const automation of automations) {
      if (this.evaluateCondition(automation.condition, sensorData)) {
        await this.executeAutomation(automation.id);
      }
    }
  }

  async executeAutomation(automationId: string) {
    const automation = await this.getAutomation(automationId);

    // Execute actions (turn on pump, adjust temperature, etc.)
    for (const action of automation.actions) {
      await this.deviceService.sendCommand(action.deviceId, action.command);
    }

    // Log execution
    await this.logAutomationExecution(automationId);
  }
}
```

### DTOs for IoT Data

#### Sensor Data DTOs

```typescript
export class SensorDataDto {
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsString()
  @IsNotEmpty()
  sensorId: string;

  @IsEnum(["temperature", "humidity", "soil_moisture", "light", "ph"])
  sensorType: SensorType;

  @IsNumber()
  @Min(-50)
  @Max(100)
  value: number;

  @IsString()
  unit: string;

  @IsDateString()
  timestamp: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class BulkSensorDataDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SensorDataDto)
  readings: SensorDataDto[];

  @IsString()
  batchId: string;
}
```

#### Automation DTOs

```typescript
export class CreateAutomationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  greenhouseId: string;

  @IsObject()
  @ValidateNested()
  @Type(() => AutomationConditionDto)
  condition: AutomationConditionDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AutomationActionDto)
  actions: AutomationActionDto[];

  @IsOptional()
  @IsObject()
  schedule?: ScheduleDto;
}

export class AutomationConditionDto {
  @IsString()
  sensorId: string;

  @IsEnum(["greater_than", "less_than", "equals", "between"])
  operator: ComparisonOperator;

  @IsNumber()
  value: number;

  @IsOptional()
  @IsNumber()
  secondValue?: number; // For 'between' operator
}
```

### Database Integration with Prisma

#### Time-Series Optimized Schema

```prisma
model SensorReading {
  id          String   @id @default(cuid())
  sensorId    String
  value       Float
  unit        String
  timestamp   DateTime @default(now())
  deviceId    String
  metadata    Json?

  sensor      Sensor   @relation(fields: [sensorId], references: [id])
  device      Device   @relation(fields: [deviceId], references: [id])

  @@index([sensorId, timestamp])
  @@index([deviceId, timestamp])
  @@index([timestamp])
}

model Automation {
  id            String   @id @default(cuid())
  name          String
  greenhouseId  String
  condition     Json     // Flexible condition storage
  actions       Json     // Array of actions to execute
  schedule      Json?    // Optional scheduling
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  greenhouse    Greenhouse @relation(fields: [greenhouseId], references: [id])
  executions    AutomationExecution[]
}
```

#### Efficient Data Queries

```typescript
// Get recent sensor data with aggregation
async getRecentSensorData(sensorId: string, hours: number = 24) {
  return this.prisma.sensorReading.findMany({
    where: {
      sensorId,
      timestamp: {
        gte: new Date(Date.now() - hours * 60 * 60 * 1000)
      }
    },
    orderBy: { timestamp: 'desc' },
    take: 1000 // Limit for performance
  });
}

// Aggregate data for charts
async getAggregatedData(sensorId: string, interval: 'hour' | 'day') {
  const sql = interval === 'hour'
    ? `SELECT date_trunc('hour', timestamp) as period, AVG(value) as avg_value
       FROM "SensorReading" WHERE "sensorId" = $1
       GROUP BY period ORDER BY period`
    : `SELECT date_trunc('day', timestamp) as period, AVG(value) as avg_value
       FROM "SensorReading" WHERE "sensorId" = $1
       GROUP BY period ORDER BY period`;

  return this.prisma.$queryRaw(sql, sensorId);
}
```

### Security & Authentication

#### Device Authentication

```typescript
@Injectable()
export class DeviceAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers["x-device-api-key"];

    if (!apiKey) return false;

    const device = await this.deviceService.validateApiKey(apiKey);
    if (!device || !device.isActive) return false;

    request.device = device;
    return true;
  }
}
```

#### Role-Based Access Control

```typescript
@Injectable()
export class GreenhouseGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const greenhouseId = request.params.greenhouseId;

    // Check if user has access to this greenhouse
    const access = await this.userService.hasGreenhouseAccess(
      user.id,
      greenhouseId
    );

    return access;
  }
}
```

### Real-Time Communication

#### WebSocket Gateway

```typescript
@WebSocketGateway(3001, { namespace: "greenhouse" })
export class GreenhouseGateway {
  @WebSocketServer()
  server: Server;

  // Emit sensor updates to subscribed clients
  emitSensorUpdate(sensorData: SensorReading) {
    this.server
      .to(`sensor-${sensorData.sensorId}`)
      .emit("sensor-update", sensorData);
  }

  // Handle client subscriptions
  @SubscribeMessage("subscribe-sensor")
  handleSensorSubscription(
    @ConnectedSocket() client: Socket,
    @MessageBody() sensorId: string
  ) {
    client.join(`sensor-${sensorId}`);
    return { status: "subscribed", sensorId };
  }

  // Handle control commands
  @SubscribeMessage("control-actuator")
  async handleActuatorControl(
    @ConnectedSocket() client: Socket,
    @MessageBody() command: ActuatorCommandDto
  ) {
    // Validate user permissions
    // Execute command
    // Broadcast status update
  }
}
```

### Error Handling & Logging

#### Global Exception Filter

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // Log IoT-specific errors
    if (exception instanceof DeviceConnectionException) {
      this.logger.error(`Device connection failed: ${exception.message}`);
    }

    // Handle sensor data validation errors
    if (exception instanceof SensorValidationException) {
      this.logger.warn(`Invalid sensor data: ${exception.message}`);
    }

    // Return appropriate error response
  }
}
```

This backend architecture ensures robust, scalable, and secure IoT data management with real-time capabilities, proper device authentication, and comprehensive automation support.
