import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { GreenhouseModule } from './greenhouse.module';
import { AuthModule } from '../auth/auth.module';
import { JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';

describe('Greenhouse Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let accessToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env.test',
        }),
        GreenhouseModule,
        AuthModule,
      ],
      providers: [PrismaService],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    await app.init();

    // Clean up database before tests
    await prisma.greenhouseSensorReading.deleteMany();
    await prisma.pumpOperation.deleteMany();
    await prisma.device.deleteMany();
    await prisma.greenhouse.deleteMany();
    await prisma.user.deleteMany();

    // Create test user and get auth token
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        image: 'test.jpg',
        password: 'hashedpassword',
      },
    });

    testUserId = testUser.id;

    // Create valid JWT token
    accessToken = await jwtService.signAsync(
      {
        id: testUser.id,
        email: testUser.email,
        username: testUser.username,
        name: testUser.name,
        image: testUser.image,
      },
      {
        secret: process.env.JWT_SECRET || 'defaultSecret',
      },
    );
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    // Clean up after each test
    await prisma.greenhouseSensorReading.deleteMany();
    await prisma.pumpOperation.deleteMany();
    await prisma.device.deleteMany();
    await prisma.greenhouse.deleteMany();
  });

  describe('POST /greenhouse', () => {
    it('should create a new greenhouse', async () => {
      const createGreenhouseDto = {
        name: 'Test Greenhouse',
        location: 'Test Location',
        description: 'Test Description',
      };
      const response = await request(app.getHttpServer())
        .post('/greenhouses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createGreenhouseDto)
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'Test Greenhouse',
        location: 'Test Location',
        description: 'Test Description',
        targetTemperature: 25.0,
        targetHumidity: 60.0,
        targetSoilMoisture: 50,
        isOnline: false,
        isConfigured: false,
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.ownerId).toBe(testUserId);
      // Note: qrCodeUrl is generated separately via POST :id/qr-code endpoint
    });

    it('should validate required fields', async () => {
      const invalidDto = {
        name: '', // Invalid: empty name
        location: 'Test Location',
      };
      await request(app.getHttpServer())
        .post('/greenhouses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidDto)
        .expect(400);
    });

    it('should require authentication', async () => {
      const createGreenhouseDto = {
        name: 'Test Greenhouse',
        location: 'Test Location',
      };
      await request(app.getHttpServer())
        .post('/greenhouses')
        .send(createGreenhouseDto)
        .expect(401);
    });
  });

  describe('GET /greenhouse', () => {
    let greenhouseId: string;

    beforeEach(async () => {
      const greenhouse = await prisma.greenhouse.create({
        data: {
          name: 'Test Greenhouse',
          location: 'Test Location',
          description: 'Test Description',
          ownerId: testUserId,
          targetTemperature: 25.0,
          targetHumidity: 60.0,
          targetSoilMoisture: 50,
        },
      });
      greenhouseId = greenhouse.id;
    });

    it('should get all greenhouses for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/greenhouses')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toMatchObject({
        name: 'Test Greenhouse',
        location: 'Test Location',
        ownerId: testUserId,
      });
    });

    it('should get greenhouse by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/greenhouses/${greenhouseId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: greenhouseId,
        name: 'Test Greenhouse',
        location: 'Test Location',
        ownerId: testUserId,
      });
    });

    it('should return 404 for non-existent greenhouse', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .get(`/greenhouses/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('PATCH /greenhouses/:id', () => {
    let greenhouseId: string;

    beforeEach(async () => {
      const greenhouse = await prisma.greenhouse.create({
        data: {
          name: 'Test Greenhouse',
          location: 'Test Location',
          description: 'Test Description',
          ownerId: testUserId,
          targetTemperature: 25.0,
          targetHumidity: 60.0,
          targetSoilMoisture: 50,
        },
      });
      greenhouseId = greenhouse.id;
    });

    it('should update greenhouse', async () => {
      const updateDto = {
        name: 'Updated Greenhouse',
        targetTemperature: 26.0,
        targetHumidity: 65.0,
      };
      const response = await request(app.getHttpServer())
        .patch(`/greenhouses/${greenhouseId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toMatchObject({
        id: greenhouseId,
        name: 'Updated Greenhouse',
        targetTemperature: 26.0,
        targetHumidity: 65.0,
      });
    });

    it('should return 404 for non-existent greenhouse', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .patch(`/greenhouses/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Test' })
        .expect(404);
    });
  });

  describe('DELETE /greenhouse/:id', () => {
    let greenhouseId: string;

    beforeEach(async () => {
      const greenhouse = await prisma.greenhouse.create({
        data: {
          name: 'Test Greenhouse',
          location: 'Test Location',
          ownerId: testUserId,
        },
      });
      greenhouseId = greenhouse.id;
    });

    it('should delete greenhouse', async () => {
      await request(app.getHttpServer())
        .delete(`/greenhouses/${greenhouseId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify deletion
      const greenhouse = await prisma.greenhouse.findUnique({
        where: { id: greenhouseId },
      });
      expect(greenhouse).toBeNull();
    });

    it('should return 404 for non-existent greenhouse', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .delete(`/greenhouses/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
  describe('POST /greenhouses/configure', () => {
    let greenhouseId: string;

    beforeEach(async () => {
      // Create greenhouse via service (which will encrypt the password properly)
      const createDto = {
        name: 'Test Greenhouse',
        location: 'Test Location',
        wifiSSID: 'TestNetwork',
        wifiPassword: 'testpassword123',
      };

      const greenhouse = await request(app.getHttpServer())
        .post('/greenhouses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto)
        .expect(201);

      greenhouseId = greenhouse.body.id;
    });
    it('should configure greenhouse with device settings', async () => {
      // First, generate QR code for the greenhouse
      await request(app.getHttpServer())
        .post(`/greenhouses/${greenhouseId}/qr-code`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      const configDto = {
        deviceId: 'ESP32-001',
        greenhouseId: greenhouseId,
        wifiSSID: 'TestNetwork',
        wifiPassword: 'testpassword123',
      };
      const response = await request(app.getHttpServer())
        .post(`/greenhouses/configure`)
        .send(configDto); // No auth needed for ESP32 configure

      expect(response.status).toBe(201);

      expect(response.body).toMatchObject({
        deviceId: 'ESP32-001',
        wifiSSID: 'TestNetwork',
        isConfigured: true,
      });
      expect(response.body.wifiPassword).toBeUndefined(); // Should not return password
    });
  });

  describe('POST /greenhouses/sensor-data', () => {
    let greenhouseId: string;

    beforeEach(async () => {
      const greenhouse = await prisma.greenhouse.create({
        data: {
          name: 'Test Greenhouse',
          location: 'Test Location',
          ownerId: testUserId,
          deviceId: 'ESP32-001',
          isConfigured: true,
        },
      });
      greenhouseId = greenhouse.id;
    });

    it('should receive and store sensor data', async () => {
      const sensorData = {
        greenhouseId: greenhouseId,
        airTemperature: 23.5,
        airHumidity: 65.0,
        soilMoisture: 45,
        soilTemperature: 22.0,
        lightIntensity: 850.0,
        waterLevel: 75.0,
        deviceId: 'ESP32-001',
      };

      const response = await request(app.getHttpServer())
        .post(`/greenhouses/sensor-data`)
        .send(sensorData) // No auth needed for ESP32 sensor data
        .expect(201);

      expect(response.body).toMatchObject({
        airTemperature: 23.5,
        airHumidity: 65.0,
        soilMoisture: 45,
        lightIntensity: 850.0,
        waterLevel: 75.0,
      }); // Verify greenhouse current values were updated
      const updatedGreenhouse = await prisma.greenhouse.findUnique({
        where: { id: greenhouseId },
      });

      expect(updatedGreenhouse).not.toBeNull();
      expect(updatedGreenhouse).toMatchObject({
        currentTemperature: 23.5,
        currentHumidity: 65.0,
        currentSoilMoisture: 45,
        currentLightIntensity: 850.0,
        currentWaterLevel: 75.0,
        isOnline: true,
      });
      expect(updatedGreenhouse!.lastDataUpdate).toBeDefined();
    });
  });

  describe('GET /greenhouse/:id/status', () => {
    let greenhouseId: string;

    beforeEach(async () => {
      const greenhouse = await prisma.greenhouse.create({
        data: {
          name: 'Test Greenhouse',
          location: 'Test Location',
          ownerId: testUserId,
          currentTemperature: 24.5,
          currentHumidity: 62.0,
          currentSoilMoisture: 48,
          currentLightIntensity: 800.0,
          currentWaterLevel: 80.0,
          isOnline: true,
          lastDataUpdate: new Date(),
        },
      });
      greenhouseId = greenhouse.id;
    });
    it('should get real-time greenhouse status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/greenhouses/${greenhouseId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        greenhouse: {
          id: greenhouseId,
          name: 'Test Greenhouse',
          isOnline: true,
          isConfigured: false,
          lastDataUpdate: expect.any(String),
        },
        currentConditions: null, // No sensor readings yet
        targets: {
          temperature: 25,
          humidity: 60,
          soilMoisture: 50,
          waterLevel: 20,
        },
        devices: [],
        alerts: expect.arrayContaining([
          expect.objectContaining({
            type: 'warning',
            message: 'No recent sensor data received',
          }),
        ]),
      });
    });
  });
  describe('POST /greenhouses/:id/qr-code', () => {
    let greenhouseId: string;

    beforeEach(async () => {
      // Create greenhouse via service (which will encrypt the password properly)
      const createDto = {
        name: 'Test Greenhouse',
        location: 'Test Location',
        wifiSSID: 'TestNetwork',
        wifiPassword: 'testpassword123',
      };

      const greenhouse = await request(app.getHttpServer())
        .post('/greenhouses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto)
        .expect(201);

      greenhouseId = greenhouse.body.id;
    });
    it('should generate QR code for greenhouse configuration', async () => {
      const response = await request(app.getHttpServer())
        .post(`/greenhouses/${greenhouseId}/qr-code`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).toBe(201);

      expect(response.body).toHaveProperty('qrCodeData');
      expect(response.body).toHaveProperty('wifiSSID');
      expect(response.body).toHaveProperty('serverURL');
      expect(response.body).toHaveProperty('greenhouseId');
      expect(response.body.qrCodeData).toMatch(/^data:image\/png;base64,/);
    });
  });
});
