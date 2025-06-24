import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PumpService } from './pump.service';
import { PrismaService } from '../prisma.service';
import { ActivatePumpDto } from './dto/pump.dto';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PumpService', () => {
  let service: PumpService;
  let prismaService: PrismaService;

  // Mock data
  const mockGreenhouseId = 'a1b2c3d4-e5f6-4789-abcd-ef0123456789';
  const mockOperationId = 'op-12345';
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
    id: mockOperationId,
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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PumpService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PumpService>(PumpService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('activatePump', () => {
    const activatePumpDto: ActivatePumpDto = {
      greenhouseId: mockGreenhouseId,
      duration: 300,
      waterAmount: 2.5,
      reason: 'manual',
    };

    beforeEach(() => {
      // Mock successful ESP32 response
      mockedAxios.post.mockResolvedValue({
        data: {
          success: true,
          message: 'Pump activated',
          operationId: mockOperationId,
        },
      });
    });

    it('should activate pump successfully', async () => {
      // Setup mocks for successful activation
      mockPrismaService.pumpOperation.findFirst.mockResolvedValue(null); // No existing operation
      mockPrismaService.device.findFirst.mockResolvedValue(mockDevice);
      mockPrismaService.pumpOperation.create.mockResolvedValue(
        mockPumpOperation,
      );
      mockPrismaService.pumpOperation.update.mockResolvedValue(
        mockPumpOperation,
      );

      const result = await service.activatePump(activatePumpDto);

      expect(result).toEqual({
        id: mockOperationId,
        greenhouseId: mockGreenhouseId,
        isActive: true,
        remainingTime: expect.any(Number),
        targetWaterAmount: 2.5,
        startedAt: expect.any(Date),
        estimatedEndTime: expect.any(Date),
        reason: 'manual',
      });

      // Verify database calls
      expect(mockPrismaService.pumpOperation.findFirst).toHaveBeenCalledWith({
        where: {
          greenhouseId: mockGreenhouseId,
          status: 'active',
        },
      });

      expect(mockPrismaService.device.findFirst).toHaveBeenCalledWith({
        where: {
          greenhouseId: mockGreenhouseId,
          type: 'esp32',
          isOnline: true,
        },
      });

      expect(mockPrismaService.pumpOperation.create).toHaveBeenCalledWith({
        data: {
          greenhouseId: mockGreenhouseId,
          duration: 300,
          waterAmount: 2.5,
          reason: 'manual',
          status: 'active',
        },
      });

      // Verify ESP32 command was sent
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `http://${mockIpAddress}/pump/control`,
        {
          action: 'activate',
          duration: 300,
          waterAmount: 2.5,
          operationId: mockOperationId,
        },
        {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    });

    it('should throw BadRequestException if pump is already active', async () => {
      // Mock existing active operation
      mockPrismaService.pumpOperation.findFirst.mockResolvedValue(
        mockPumpOperation,
      );

      await expect(service.activatePump(activatePumpDto)).rejects.toThrow(
        new BadRequestException('Pump is already active for this greenhouse'),
      );

      expect(mockPrismaService.device.findFirst).not.toHaveBeenCalled();
      expect(mockPrismaService.pumpOperation.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if no online ESP32 device found', async () => {
      mockPrismaService.pumpOperation.findFirst.mockResolvedValue(null);
      mockPrismaService.device.findFirst.mockResolvedValue(null);

      await expect(service.activatePump(activatePumpDto)).rejects.toThrow(
        new NotFoundException(
          'No online ESP32 device found for this greenhouse',
        ),
      );

      expect(mockPrismaService.pumpOperation.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if ESP32 communication fails', async () => {
      mockPrismaService.pumpOperation.findFirst.mockResolvedValue(null);
      mockPrismaService.device.findFirst.mockResolvedValue(mockDevice);
      mockPrismaService.pumpOperation.create.mockResolvedValue(
        mockPumpOperation,
      );

      // Mock ESP32 failure
      mockedAxios.post.mockRejectedValue(new Error('Connection timeout'));

      await expect(service.activatePump(activatePumpDto)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockPrismaService.pumpOperation.create).toHaveBeenCalled();
    });

    it('should handle activation without water amount', async () => {
      const dtoWithoutWater = {
        greenhouseId: mockGreenhouseId,
        duration: 300,
        reason: 'scheduled',
      };

      const operationWithoutWater = { ...mockPumpOperation, waterAmount: null };

      mockPrismaService.pumpOperation.findFirst.mockResolvedValue(null);
      mockPrismaService.device.findFirst.mockResolvedValue(mockDevice);
      mockPrismaService.pumpOperation.create.mockResolvedValue(
        operationWithoutWater,
      );
      mockPrismaService.pumpOperation.update.mockResolvedValue(
        operationWithoutWater,
      );

      const result = await service.activatePump(dtoWithoutWater);

      expect(result.targetWaterAmount).toBeNull();
      expect(mockPrismaService.pumpOperation.create).toHaveBeenCalledWith({
        data: {
          greenhouseId: mockGreenhouseId,
          duration: 300,
          waterAmount: undefined,
          reason: 'scheduled',
          status: 'active',
        },
      });
    });
  });

  describe('getPumpStatus', () => {
    it('should return pump status for active operation', async () => {
      mockPrismaService.pumpOperation.findFirst.mockResolvedValue(
        mockPumpOperation,
      );

      const result = await service.getPumpStatus(mockGreenhouseId);

      expect(result).toEqual({
        id: mockOperationId,
        greenhouseId: mockGreenhouseId,
        isActive: true,
        remainingTime: expect.any(Number),
        targetWaterAmount: 2.5,
        startedAt: expect.any(Date),
        estimatedEndTime: expect.any(Date),
        reason: 'manual',
      });

      expect(mockPrismaService.pumpOperation.findFirst).toHaveBeenCalledWith({
        where: {
          greenhouseId: mockGreenhouseId,
          status: 'active',
        },
        orderBy: {
          startedAt: 'desc',
        },
      });
    });

    it('should return null if no active operation', async () => {
      mockPrismaService.pumpOperation.findFirst.mockResolvedValue(null);

      const result = await service.getPumpStatus(mockGreenhouseId);

      expect(result).toBeNull();
    });
  });

  describe('stopPump', () => {
    beforeEach(() => {
      mockedAxios.post.mockResolvedValue({
        data: { success: true, message: 'Pump stopped' },
      });
    });

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

      const result = await service.stopPump(mockGreenhouseId);

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.pumpOperation.update).toHaveBeenCalledWith({
        where: { id: mockOperationId },
        data: {
          status: 'cancelled',
          endedAt: expect.any(Date),
        },
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `http://${mockIpAddress}/pump/control`,
        {
          action: 'stop',
          operationId: mockOperationId,
        },
        expect.any(Object),
      );
    });

    it('should throw NotFoundException if no active operation', async () => {
      mockPrismaService.pumpOperation.findFirst.mockResolvedValue(null);

      await expect(service.stopPump(mockGreenhouseId)).rejects.toThrow(
        new NotFoundException(
          'No active pump operation found for this greenhouse',
        ),
      );
    });

    it('should stop pump even if ESP32 communication fails', async () => {
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

      // Mock ESP32 failure
      mockedAxios.post.mockRejectedValue(new Error('Connection timeout'));

      const result = await service.stopPump(mockGreenhouseId);

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.pumpOperation.update).toHaveBeenCalled();
    });

    it('should stop pump without device (offline device)', async () => {
      const stoppedOperation = {
        ...mockPumpOperation,
        status: 'cancelled',
        endedAt: new Date(),
      };

      mockPrismaService.pumpOperation.findFirst.mockResolvedValue(
        mockPumpOperation,
      );
      mockPrismaService.device.findFirst.mockResolvedValue(null); // No device found
      mockPrismaService.pumpOperation.update.mockResolvedValue(
        stoppedOperation,
      );

      const result = await service.stopPump(mockGreenhouseId);

      expect(result.isActive).toBe(false);
      expect(mockedAxios.post).not.toHaveBeenCalled(); // No ESP32 command sent
    });
  });

  describe('getPumpHistory', () => {
    it('should return pump history with default limit', async () => {
      const mockHistory = [
        mockPumpOperation,
        { ...mockPumpOperation, id: 'op-12346', status: 'completed' },
      ];

      mockPrismaService.pumpOperation.findMany.mockResolvedValue(mockHistory);

      const result = await service.getPumpHistory(mockGreenhouseId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: mockOperationId,
        greenhouseId: mockGreenhouseId,
        duration: 300,
        waterAmount: 2.5,
        reason: 'manual',
        startedAt: expect.any(Date),
        endedAt: undefined,
        status: 'active',
        errorMessage: undefined,
      });

      expect(mockPrismaService.pumpOperation.findMany).toHaveBeenCalledWith({
        where: { greenhouseId: mockGreenhouseId },
        orderBy: { startedAt: 'desc' },
        take: 50,
      });
    });

    it('should return pump history with custom limit', async () => {
      mockPrismaService.pumpOperation.findMany.mockResolvedValue([]);

      await service.getPumpHistory(mockGreenhouseId, 10);

      expect(mockPrismaService.pumpOperation.findMany).toHaveBeenCalledWith({
        where: { greenhouseId: mockGreenhouseId },
        orderBy: { startedAt: 'desc' },
        take: 10,
      });
    });
  });

  describe('updatePumpStatus', () => {
    it('should update pump operation status to completed', async () => {
      mockPrismaService.pumpOperation.update.mockResolvedValue(
        mockPumpOperation,
      );

      await service.updatePumpStatus(mockOperationId, 'completed');

      expect(mockPrismaService.pumpOperation.update).toHaveBeenCalledWith({
        where: { id: mockOperationId },
        data: {
          status: 'completed',
          errorMessage: undefined,
          endedAt: expect.any(Date),
        },
      });
    });

    it('should update pump operation status to error with message', async () => {
      const errorMessage = 'Sensor failure';
      mockPrismaService.pumpOperation.update.mockResolvedValue(
        mockPumpOperation,
      );

      await service.updatePumpStatus(mockOperationId, 'error', errorMessage);

      expect(mockPrismaService.pumpOperation.update).toHaveBeenCalledWith({
        where: { id: mockOperationId },
        data: {
          status: 'error',
          errorMessage,
          endedAt: expect.any(Date),
        },
      });
    });

    it('should update status to active without endedAt', async () => {
      mockPrismaService.pumpOperation.update.mockResolvedValue(
        mockPumpOperation,
      );

      await service.updatePumpStatus(mockOperationId, 'active');

      expect(mockPrismaService.pumpOperation.update).toHaveBeenCalledWith({
        where: { id: mockOperationId },
        data: {
          status: 'active',
          errorMessage: undefined,
          endedAt: undefined,
        },
      });
    });
  });

  describe('registerDevice', () => {
    const deviceInfo = {
      name: 'ESP32-Greenhouse-1',
      greenhouseId: mockGreenhouseId,
      ipAddress: mockIpAddress,
      macAddress: mockMacAddress,
      firmwareVersion: '1.0.0',
    };

    it('should register new device', async () => {
      mockPrismaService.device.upsert.mockResolvedValue(mockDevice);

      await service.registerDevice(deviceInfo);

      expect(mockPrismaService.device.upsert).toHaveBeenCalledWith({
        where: { macAddress: mockMacAddress },
        update: {
          name: deviceInfo.name,
          greenhouseId: deviceInfo.greenhouseId,
          ipAddress: deviceInfo.ipAddress,
          firmwareVersion: deviceInfo.firmwareVersion,
          isOnline: true,
          lastSeen: expect.any(Date),
        },
        create: {
          name: deviceInfo.name,
          greenhouseId: deviceInfo.greenhouseId,
          ipAddress: deviceInfo.ipAddress,
          macAddress: deviceInfo.macAddress,
          firmwareVersion: deviceInfo.firmwareVersion,
          isOnline: true,
          type: 'esp32',
          lastSeen: expect.any(Date),
        },
      });
    });
    it('should register device without firmware version', async () => {
      const deviceInfoWithoutFirmware = {
        name: deviceInfo.name,
        greenhouseId: deviceInfo.greenhouseId,
        ipAddress: deviceInfo.ipAddress,
        macAddress: deviceInfo.macAddress,
      };

      mockPrismaService.device.upsert.mockResolvedValue(mockDevice);

      await service.registerDevice(deviceInfoWithoutFirmware);

      expect(mockPrismaService.device.upsert).toHaveBeenCalledWith({
        where: { macAddress: mockMacAddress },
        update: {
          name: deviceInfo.name,
          greenhouseId: deviceInfo.greenhouseId,
          ipAddress: deviceInfo.ipAddress,
          firmwareVersion: undefined,
          isOnline: true,
          lastSeen: expect.any(Date),
        },
        create: {
          name: deviceInfo.name,
          greenhouseId: deviceInfo.greenhouseId,
          ipAddress: deviceInfo.ipAddress,
          macAddress: deviceInfo.macAddress,
          firmwareVersion: undefined,
          isOnline: true,
          type: 'esp32',
          lastSeen: expect.any(Date),
        },
      });
    });
  });

  describe('mapToStatusDto', () => {
    it('should map active operation correctly', () => {
      const activeOperation = {
        ...mockPumpOperation,
        startedAt: new Date(Date.now() - 60000), // 1 minute ago
      };

      // Use reflection to access private method
      const result = (service as any).mapToStatusDto(activeOperation);

      expect(result).toEqual({
        id: mockOperationId,
        greenhouseId: mockGreenhouseId,
        isActive: true,
        remainingTime: expect.any(Number),
        targetWaterAmount: 2.5,
        startedAt: expect.any(Date),
        estimatedEndTime: expect.any(Date),
        reason: 'manual',
      });

      expect(result.remainingTime).toBeGreaterThanOrEqual(0);
      expect(result.remainingTime).toBeLessThanOrEqual(300);
    });

    it('should map completed operation correctly', () => {
      const completedOperation = {
        ...mockPumpOperation,
        status: 'completed',
        endedAt: new Date(),
      };

      const result = (service as any).mapToStatusDto(completedOperation);

      expect(result).toEqual({
        id: mockOperationId,
        greenhouseId: mockGreenhouseId,
        isActive: false,
        remainingTime: undefined,
        targetWaterAmount: 2.5,
        startedAt: expect.any(Date),
        estimatedEndTime: undefined,
        reason: 'manual',
      });
    });
  });

  describe('sendPumpCommand - error scenarios', () => {
    it('should handle timeout errors', async () => {
      mockPrismaService.pumpOperation.findFirst.mockResolvedValue(null);
      mockPrismaService.device.findFirst.mockResolvedValue(mockDevice);
      mockPrismaService.pumpOperation.create.mockResolvedValue(
        mockPumpOperation,
      );

      // Mock timeout error
      mockedAxios.post.mockRejectedValue({
        message: 'timeout of 10000ms exceeded',
        code: 'ECONNABORTED',
      });

      const activatePumpDto: ActivatePumpDto = {
        greenhouseId: mockGreenhouseId,
        duration: 300,
        waterAmount: 2.5,
        reason: 'manual',
      };

      await expect(service.activatePump(activatePumpDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle network errors', async () => {
      mockPrismaService.pumpOperation.findFirst.mockResolvedValue(null);
      mockPrismaService.device.findFirst.mockResolvedValue(mockDevice);
      mockPrismaService.pumpOperation.create.mockResolvedValue(
        mockPumpOperation,
      );

      // Mock network error
      mockedAxios.post.mockRejectedValue({
        message: 'ECONNREFUSED',
        code: 'ECONNREFUSED',
      });

      const activatePumpDto: ActivatePumpDto = {
        greenhouseId: mockGreenhouseId,
        duration: 300,
        waterAmount: 2.5,
        reason: 'manual',
      };

      await expect(service.activatePump(activatePumpDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
