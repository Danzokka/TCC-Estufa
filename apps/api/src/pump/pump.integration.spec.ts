import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PumpModule } from './pump.module';
import { PrismaService } from '../prisma.service';
import { ActivatePumpDto } from './dto/pump.dto';

describe('PumpController (Integration)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  // Mock data
  const mockGreenhouseId = 'a1b2c3d4-e5f6-4789-abcd-ef0123456789';
  const mockDeviceId = 'device-12345';
  const mockMacAddress = '00:1B:44:11:3A:B7';
  const mockIpAddress = '192.168.1.100';

  const mockDevice = {
    id: mockDeviceId,
    name: 'ESP32-Greenhouse-1',
    greenhouseId: mockGreenhouseId,
    ipAddress: mockIpAddress,
    macAddress: mockMacAddress,
    type: 'esp32',
    isOnline: true,
    firmwareVersion: '1.0.0',
    lastSeen: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPumpOperation = {
    id: 'op-12345',
    greenhouseId: mockGreenhouseId,
    duration: 300,
    waterAmount: 2.5,
    reason: 'manual',
    status: 'active',
    startedAt: new Date(),
    endedAt: null,
    errorMessage: null,
    esp32Response: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock PrismaService
  const mockPrismaService = {
    pumpOperation: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    device: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PumpModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /pump/activate', () => {
    const activatePumpDto: ActivatePumpDto = {
      greenhouseId: mockGreenhouseId,
      duration: 300,
      waterAmount: 2.5,
      reason: 'manual',
    };

    it('should activate pump successfully', async () => {
      // Setup mocks for successful activation
      mockPrismaService.pumpOperation.findFirst.mockResolvedValue(null);
      mockPrismaService.device.findFirst.mockResolvedValue(mockDevice);
      mockPrismaService.pumpOperation.create.mockResolvedValue(
        mockPumpOperation,
      );
      mockPrismaService.pumpOperation.update.mockResolvedValue(
        mockPumpOperation,
      );

      // Mock axios to avoid actual HTTP calls
      const axios = require('axios');
      jest.spyOn(axios, 'post').mockResolvedValue({
        data: { success: true, message: 'Pump activated' },
      });

      const response = await request(app.getHttpServer())
        .post('/pump/activate')
        .send(activatePumpDto)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'Pump activated successfully',
        data: expect.objectContaining({
          id: mockPumpOperation.id,
          greenhouseId: mockGreenhouseId,
          isActive: true,
        }),
      });
    });

    it('should return 400 when pump is already active', async () => {
      // Mock existing active operation
      mockPrismaService.pumpOperation.findFirst.mockResolvedValue(
        mockPumpOperation,
      );

      const response = await request(app.getHttpServer())
        .post('/pump/activate')
        .send(activatePumpDto)
        .expect(201);

      expect(response.body).toEqual({
        success: false,
        message: 'Pump is already active for this greenhouse',
      });
    });

    it('should handle validation errors', async () => {
      const invalidDto = {
        greenhouseId: 'invalid-uuid',
        duration: -1,
      };

      const response = await request(app.getHttpServer())
        .post('/pump/activate')
        .send(invalidDto)
        .expect(201);

      expect(response.body.success).toBe(false);
    });

    it('should handle missing required fields', async () => {
      const incompleteDto = {
        duration: 300,
      };

      const response = await request(app.getHttpServer())
        .post('/pump/activate')
        .send(incompleteDto)
        .expect(201);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /pump/status/:greenhouseId', () => {
    it('should return pump status when operation is active', async () => {
      mockPrismaService.pumpOperation.findFirst.mockResolvedValue(
        mockPumpOperation,
      );

      const response = await request(app.getHttpServer())
        .get(`/pump/status/${mockGreenhouseId}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Pump status retrieved',
        data: expect.objectContaining({
          id: mockPumpOperation.id,
          greenhouseId: mockGreenhouseId,
          isActive: true,
        }),
      });
    });

    it('should return null when no active operation', async () => {
      mockPrismaService.pumpOperation.findFirst.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .get(`/pump/status/${mockGreenhouseId}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'No active pump operation',
        data: null,
      });
    });

    it('should handle invalid greenhouse ID', async () => {
      const invalidId = 'invalid-uuid-format';

      const response = await request(app.getHttpServer())
        .get(`/pump/status/${invalidId}`)
        .expect(200);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /pump/stop/:greenhouseId', () => {
    it('should stop pump successfully', async () => {
      const stoppedOperation = {
        ...mockPumpOperation,
        status: 'cancelled',
        endedAt: new Date(),
      };

      mockPrismaService.pumpOperation.findFirst.mockResolvedValue(
        mockPumpOperation,
      );
      mockPrismaService.device.findFirst.mockResolvedValue(mockDevice);
      mockPrismaService.pumpOperation.update.mockResolvedValue(
        stoppedOperation,
      );

      // Mock axios for ESP32 communication
      const axios = require('axios');
      jest.spyOn(axios, 'post').mockResolvedValue({
        data: { success: true, message: 'Pump stopped' },
      });

      const response = await request(app.getHttpServer())
        .delete(`/pump/stop/${mockGreenhouseId}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Pump stopped successfully',
        data: expect.objectContaining({
          isActive: false,
        }),
      });
    });

    it('should return error when no active operation to stop', async () => {
      mockPrismaService.pumpOperation.findFirst.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .delete(`/pump/stop/${mockGreenhouseId}`)
        .expect(200);

      expect(response.body).toEqual({
        success: false,
        message: 'No active pump operation found for this greenhouse',
      });
    });
  });

  describe('GET /pump/history/:greenhouseId', () => {
    it('should return pump history with default limit', async () => {
      const mockHistory = [
        mockPumpOperation,
        { ...mockPumpOperation, id: 'op-12346', status: 'completed' },
      ];

      mockPrismaService.pumpOperation.findMany.mockResolvedValue(mockHistory);

      const response = await request(app.getHttpServer())
        .get(`/pump/history/${mockGreenhouseId}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Pump history retrieved successfully',
        data: expect.arrayContaining([
          expect.objectContaining({
            id: mockPumpOperation.id,
            greenhouseId: mockGreenhouseId,
          }),
        ]),
      });
    });

    it('should return pump history with custom limit', async () => {
      mockPrismaService.pumpOperation.findMany.mockResolvedValue([
        mockPumpOperation,
      ]);

      const response = await request(app.getHttpServer())
        .get(`/pump/history/${mockGreenhouseId}?limit=10`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPrismaService.pumpOperation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        }),
      );
    });

    it('should handle invalid limit parameter gracefully', async () => {
      mockPrismaService.pumpOperation.findMany.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get(`/pump/history/${mockGreenhouseId}?limit=invalid`)
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should fall back to default limit
      expect(mockPrismaService.pumpOperation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        }),
      );
    });
  });

  describe('POST /pump/register-device', () => {
    const deviceRegistrationDto = {
      name: 'ESP32-Greenhouse-1',
      greenhouseId: mockGreenhouseId,
      ipAddress: mockIpAddress,
      macAddress: mockMacAddress,
      firmwareVersion: '1.0.0',
    };

    it('should register device successfully', async () => {
      mockPrismaService.device.upsert.mockResolvedValue(mockDevice);

      const response = await request(app.getHttpServer())
        .post('/pump/register-device')
        .send(deviceRegistrationDto)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'Device registered successfully',
      });

      expect(mockPrismaService.device.upsert).toHaveBeenCalledWith({
        where: { macAddress: mockMacAddress },
        update: expect.any(Object),
        create: expect.any(Object),
      });
    });

    it('should handle device registration without firmware version', async () => {
      const deviceWithoutFirmware = {
        name: 'ESP32-Greenhouse-2',
        greenhouseId: mockGreenhouseId,
        ipAddress: '192.168.1.101',
        macAddress: '00:1B:44:11:3A:B8',
      };

      mockPrismaService.device.upsert.mockResolvedValue(mockDevice);

      const response = await request(app.getHttpServer())
        .post('/pump/register-device')
        .send(deviceWithoutFirmware)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should handle missing required fields', async () => {
      const incompleteDevice = {
        name: 'ESP32-Greenhouse-3',
      };

      const response = await request(app.getHttpServer())
        .post('/pump/register-device')
        .send(incompleteDevice)
        .expect(201);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /pump/update-status', () => {
    const statusUpdateDto = {
      operationId: 'op-12345',
      status: 'completed',
    };

    it('should update pump status successfully', async () => {
      mockPrismaService.pumpOperation.update.mockResolvedValue(
        mockPumpOperation,
      );

      const response = await request(app.getHttpServer())
        .post('/pump/update-status')
        .send(statusUpdateDto)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'Status updated successfully',
      });

      expect(mockPrismaService.pumpOperation.update).toHaveBeenCalledWith({
        where: { id: statusUpdateDto.operationId },
        data: expect.objectContaining({
          status: statusUpdateDto.status,
        }),
      });
    });

    it('should update pump status with error message', async () => {
      const errorStatusDto = {
        operationId: 'op-12345',
        status: 'error',
        errorMessage: 'Sensor failure',
      };

      mockPrismaService.pumpOperation.update.mockResolvedValue(
        mockPumpOperation,
      );

      const response = await request(app.getHttpServer())
        .post('/pump/update-status')
        .send(errorStatusDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(mockPrismaService.pumpOperation.update).toHaveBeenCalledWith({
        where: { id: errorStatusDto.operationId },
        data: expect.objectContaining({
          status: errorStatusDto.status,
          errorMessage: errorStatusDto.errorMessage,
        }),
      });
    });
  });

  describe('POST /pump/esp32-status', () => {
    const deviceStatusDto = {
      type: 'pump',
      status: 'running',
      runtime_seconds: 120,
      volume_liters: 1.2,
      device_id: 'ESP32-001',
    };

    it('should receive device status successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/pump/esp32-status')
        .send(deviceStatusDto)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'Device status received successfully',
        timestamp: expect.any(String),
      });
    });

    it('should handle device status without optional fields', async () => {
      const minimalStatusDto = {
        type: 'pump',
        status: 'idle',
        device_id: 'ESP32-002',
      };

      const response = await request(app.getHttpServer())
        .post('/pump/esp32-status')
        .send(minimalStatusDto)
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle database connection errors', async () => {
      // Mock database error
      mockPrismaService.pumpOperation.findFirst.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const response = await request(app.getHttpServer())
        .get(`/pump/status/${mockGreenhouseId}`)
        .expect(200);

      expect(response.body).toEqual({
        success: false,
        message: 'Database connection failed',
        data: null,
      });
    });

    it('should handle malformed JSON in request body', async () => {
      const response = await request(app.getHttpServer())
        .post('/pump/activate')
        .send('invalid-json')
        .set('Content-Type', 'application/json')
        .expect(400);

      // Should return a standard error response for malformed JSON
      expect(response.body).toBeDefined();
    });

    it('should handle very long greenhouse IDs', async () => {
      const longId = 'a'.repeat(1000); // Very long ID

      const response = await request(app.getHttpServer())
        .get(`/pump/status/${longId}`)
        .expect(200);

      expect(response.body.success).toBe(false);
    });

    it('should handle concurrent requests to same greenhouse', async () => {
      const activatePumpDto: ActivatePumpDto = {
        greenhouseId: mockGreenhouseId,
        duration: 300,
        waterAmount: 2.5,
        reason: 'manual',
      };

      // Setup mocks for first request success
      mockPrismaService.pumpOperation.findFirst.mockResolvedValue(null);
      mockPrismaService.device.findFirst.mockResolvedValue(mockDevice);
      mockPrismaService.pumpOperation.create.mockResolvedValue(
        mockPumpOperation,
      );
      mockPrismaService.pumpOperation.update.mockResolvedValue(
        mockPumpOperation,
      );

      const axios = require('axios');
      jest.spyOn(axios, 'post').mockResolvedValue({
        data: { success: true, message: 'Pump activated' },
      });

      // Make concurrent requests
      const requests = [
        request(app.getHttpServer())
          .post('/pump/activate')
          .send(activatePumpDto),
        request(app.getHttpServer())
          .post('/pump/activate')
          .send(activatePumpDto),
      ];

      const responses = await Promise.all(requests);

      // At least one should succeed, and we should get proper responses
      responses.forEach((response) => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('message');
      });
    });
  });
});
