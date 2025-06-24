import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PumpController } from './pump.controller';
import { PumpService } from './pump.service';
import { ActivatePumpDto, PumpStatusDto, PumpHistoryDto } from './dto/pump.dto';

describe('PumpController', () => {
  let controller: PumpController;
  let pumpService: PumpService;

  // Mock data
  const mockGreenhouseId = 'a1b2c3d4-e5f6-4789-abcd-ef0123456789';
  const mockOperationId = 'op-12345';

  const mockPumpStatus: PumpStatusDto = {
    id: mockOperationId,
    greenhouseId: mockGreenhouseId,
    isActive: true,
    remainingTime: 240,
    targetWaterAmount: 2.5,
    startedAt: new Date(),
    estimatedEndTime: new Date(Date.now() + 240000),
    reason: 'manual',
  };

  const mockPumpHistory: PumpHistoryDto[] = [
    {
      id: mockOperationId,
      greenhouseId: mockGreenhouseId,
      duration: 300,
      waterAmount: 2.5,
      reason: 'manual',
      startedAt: new Date(),
      endedAt: new Date(),
      status: 'completed',
    },
    {
      id: 'op-12346',
      greenhouseId: mockGreenhouseId,
      duration: 180,
      waterAmount: 1.5,
      reason: 'automatic',
      startedAt: new Date(Date.now() - 86400000), // 1 day ago
      endedAt: new Date(Date.now() - 86400000 + 180000),
      status: 'completed',
    },
  ];

  const mockPumpService = {
    activatePump: jest.fn(),
    getPumpStatus: jest.fn(),
    stopPump: jest.fn(),
    getPumpHistory: jest.fn(),
    registerDevice: jest.fn(),
    updatePumpStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PumpController],
      providers: [
        {
          provide: PumpService,
          useValue: mockPumpService,
        },
      ],
    }).compile();

    controller = module.get<PumpController>(PumpController);
    pumpService = module.get<PumpService>(PumpService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('activatePump', () => {
    const activatePumpDto: ActivatePumpDto = {
      greenhouseId: mockGreenhouseId,
      duration: 300,
      waterAmount: 2.5,
      reason: 'manual',
    };

    it('should activate pump successfully', async () => {
      mockPumpService.activatePump.mockResolvedValue(mockPumpStatus);

      const result = await controller.activatePump(activatePumpDto);

      expect(result).toEqual({
        success: true,
        message: 'Pump activated successfully',
        data: mockPumpStatus,
      });

      expect(mockPumpService.activatePump).toHaveBeenCalledWith(
        activatePumpDto,
      );
    });

    it('should handle activation errors gracefully', async () => {
      const errorMessage = 'Pump is already active for this greenhouse';
      mockPumpService.activatePump.mockRejectedValue(
        new BadRequestException(errorMessage),
      );

      const result = await controller.activatePump(activatePumpDto);

      expect(result).toEqual({
        success: false,
        message: errorMessage,
      });

      expect(mockPumpService.activatePump).toHaveBeenCalledWith(
        activatePumpDto,
      );
    });

    it('should handle unknown errors', async () => {
      mockPumpService.activatePump.mockRejectedValue(new Error());

      const result = await controller.activatePump(activatePumpDto);

      expect(result).toEqual({
        success: false,
        message: 'Failed to activate pump',
      });
    });

    it('should handle errors without message', async () => {
      mockPumpService.activatePump.mockRejectedValue({});

      const result = await controller.activatePump(activatePumpDto);

      expect(result).toEqual({
        success: false,
        message: 'Failed to activate pump',
      });
    });
  });

  describe('getPumpStatus', () => {
    it('should return pump status when active operation exists', async () => {
      mockPumpService.getPumpStatus.mockResolvedValue(mockPumpStatus);

      const result = await controller.getPumpStatus(mockGreenhouseId);

      expect(result).toEqual({
        success: true,
        message: 'Pump status retrieved',
        data: mockPumpStatus,
      });

      expect(mockPumpService.getPumpStatus).toHaveBeenCalledWith(
        mockGreenhouseId,
      );
    });

    it('should return null when no active operation', async () => {
      mockPumpService.getPumpStatus.mockResolvedValue(null);

      const result = await controller.getPumpStatus(mockGreenhouseId);

      expect(result).toEqual({
        success: true,
        message: 'No active pump operation',
        data: null,
      });

      expect(mockPumpService.getPumpStatus).toHaveBeenCalledWith(
        mockGreenhouseId,
      );
    });

    it('should handle service errors gracefully', async () => {
      const errorMessage = 'Database connection failed';
      mockPumpService.getPumpStatus.mockRejectedValue(new Error(errorMessage));

      const result = await controller.getPumpStatus(mockGreenhouseId);

      expect(result).toEqual({
        success: false,
        message: errorMessage,
        data: null,
      });
    });

    it('should handle errors without message', async () => {
      mockPumpService.getPumpStatus.mockRejectedValue({});

      const result = await controller.getPumpStatus(mockGreenhouseId);

      expect(result).toEqual({
        success: false,
        message: 'Failed to get pump status',
        data: null,
      });
    });
  });

  describe('stopPump', () => {
    const stoppedPumpStatus: PumpStatusDto = {
      ...mockPumpStatus,
      isActive: false,
      remainingTime: undefined,
      estimatedEndTime: undefined,
    };

    it('should stop pump successfully', async () => {
      mockPumpService.stopPump.mockResolvedValue(stoppedPumpStatus);

      const result = await controller.stopPump(mockGreenhouseId);

      expect(result).toEqual({
        success: true,
        message: 'Pump stopped successfully',
        data: stoppedPumpStatus,
      });

      expect(mockPumpService.stopPump).toHaveBeenCalledWith(mockGreenhouseId);
    });

    it('should handle stop errors when no active operation', async () => {
      const errorMessage = 'No active pump operation found for this greenhouse';
      mockPumpService.stopPump.mockRejectedValue(
        new NotFoundException(errorMessage),
      );

      const result = await controller.stopPump(mockGreenhouseId);

      expect(result).toEqual({
        success: false,
        message: errorMessage,
      });

      expect(mockPumpService.stopPump).toHaveBeenCalledWith(mockGreenhouseId);
    });

    it('should handle unknown stop errors', async () => {
      mockPumpService.stopPump.mockRejectedValue(new Error());

      const result = await controller.stopPump(mockGreenhouseId);

      expect(result).toEqual({
        success: false,
        message: 'Failed to stop pump',
      });
    });
  });

  describe('getPumpHistory', () => {
    it('should return pump history with default limit', async () => {
      mockPumpService.getPumpHistory.mockResolvedValue(mockPumpHistory);

      const result = await controller.getPumpHistory(mockGreenhouseId);
      expect(result).toEqual({
        success: true,
        message: 'Pump history retrieved successfully',
        data: mockPumpHistory,
      });

      expect(mockPumpService.getPumpHistory).toHaveBeenCalledWith(
        mockGreenhouseId,
        50,
      );
    });

    it('should return pump history with custom limit', async () => {
      const customLimit = '10';
      mockPumpService.getPumpHistory.mockResolvedValue([mockPumpHistory[0]]);

      const result = await controller.getPumpHistory(
        mockGreenhouseId,
        customLimit,
      );
      expect(result).toEqual({
        success: true,
        message: 'Pump history retrieved successfully',
        data: [mockPumpHistory[0]],
      });

      expect(mockPumpService.getPumpHistory).toHaveBeenCalledWith(
        mockGreenhouseId,
        10,
      );
    });
    it('should return empty history when no operations exist', async () => {
      mockPumpService.getPumpHistory.mockResolvedValue([]);

      const result = await controller.getPumpHistory(mockGreenhouseId);

      expect(result).toEqual({
        success: true,
        message: 'Pump history retrieved successfully',
        data: [],
      });
    });
    it('should handle invalid limit parameter', async () => {
      const invalidLimit = 'invalid';
      mockPumpService.getPumpHistory.mockResolvedValue([]);

      const result = await controller.getPumpHistory(
        mockGreenhouseId,
        invalidLimit,
      );

      expect(result).toEqual({
        success: true,
        message: 'Pump history retrieved successfully',
        data: [],
      });

      // Should fall back to default limit when parsing fails
      expect(mockPumpService.getPumpHistory).toHaveBeenCalledWith(
        mockGreenhouseId,
        50,
      );
    });

    it('should handle service errors gracefully', async () => {
      const errorMessage = 'Database query failed';
      mockPumpService.getPumpHistory.mockRejectedValue(new Error(errorMessage));

      const result = await controller.getPumpHistory(mockGreenhouseId);

      expect(result).toEqual({
        success: false,
        message: errorMessage,
        data: [],
      });
    });
    it('should handle errors without message', async () => {
      mockPumpService.getPumpHistory.mockRejectedValue({});

      const result = await controller.getPumpHistory(mockGreenhouseId);

      expect(result).toEqual({
        success: false,
        message: 'Failed to get pump history',
        data: [],
      });
    });
  });

  describe('registerDevice', () => {
    const deviceRegistrationDto = {
      name: 'ESP32-Greenhouse-1',
      greenhouseId: mockGreenhouseId,
      ipAddress: '192.168.1.100',
      macAddress: '00:1B:44:11:3A:B7',
      firmwareVersion: '1.0.0',
    };

    it('should register device successfully', async () => {
      mockPumpService.registerDevice.mockResolvedValue(undefined);

      const result = await controller.registerDevice(deviceRegistrationDto);

      expect(result).toEqual({
        success: true,
        message: 'Device registered successfully',
      });

      expect(mockPumpService.registerDevice).toHaveBeenCalledWith(
        deviceRegistrationDto,
      );
    });

    it('should handle device registration errors', async () => {
      const errorMessage = 'Invalid MAC address format';
      mockPumpService.registerDevice.mockRejectedValue(
        new BadRequestException(errorMessage),
      );

      const result = await controller.registerDevice(deviceRegistrationDto);

      expect(result).toEqual({
        success: false,
        message: errorMessage,
      });
    });

    it('should handle unknown registration errors', async () => {
      mockPumpService.registerDevice.mockRejectedValue(new Error());

      const result = await controller.registerDevice(deviceRegistrationDto);

      expect(result).toEqual({
        success: false,
        message: 'Failed to register device',
      });
    });
  });
  describe('updatePumpStatus', () => {
    const statusUpdateDto = {
      operationId: mockOperationId,
      status: 'completed' as const,
    };

    it('should update pump status successfully', async () => {
      mockPumpService.updatePumpStatus.mockResolvedValue(undefined);

      const result = await controller.updatePumpStatus(statusUpdateDto);

      expect(result).toEqual({
        success: true,
        message: 'Status updated successfully',
      });

      expect(mockPumpService.updatePumpStatus).toHaveBeenCalledWith(
        mockOperationId,
        'completed',
        undefined,
      );
    });

    it('should update pump status with error message', async () => {
      const errorStatusDto = {
        operationId: mockOperationId,
        status: 'error' as const,
        errorMessage: 'Sensor failure',
      };

      mockPumpService.updatePumpStatus.mockResolvedValue(undefined);

      const result = await controller.updatePumpStatus(errorStatusDto);

      expect(result).toEqual({
        success: true,
        message: 'Status updated successfully',
      });

      expect(mockPumpService.updatePumpStatus).toHaveBeenCalledWith(
        mockOperationId,
        'error',
        'Sensor failure',
      );
    });

    it('should handle status update errors', async () => {
      const errorMessage = 'Operation not found';
      mockPumpService.updatePumpStatus.mockRejectedValue(
        new NotFoundException(errorMessage),
      );

      const result = await controller.updatePumpStatus(statusUpdateDto);

      expect(result).toEqual({
        success: false,
        message: errorMessage,
      });
    });

    it('should handle unknown status update errors', async () => {
      mockPumpService.updatePumpStatus.mockRejectedValue(new Error());

      const result = await controller.updatePumpStatus(statusUpdateDto);

      expect(result).toEqual({
        success: false,
        message: 'Failed to update status',
      });
    });
  });

  describe('receiveDeviceStatus', () => {
    const deviceStatusDto = {
      type: 'pump',
      status: 'running',
      runtime_seconds: 120,
      volume_liters: 1.2,
      device_id: 'ESP32-001',
    };

    it('should receive device status successfully', async () => {
      const result = await controller.receiveDeviceStatus(deviceStatusDto);

      expect(result).toEqual({
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

      const result = await controller.receiveDeviceStatus(minimalStatusDto);

      expect(result).toEqual({
        success: true,
        message: 'Device status received successfully',
        timestamp: expect.any(String),
      });
    });

    it('should handle device status processing errors', async () => {
      // Spy on console.error to suppress error output during test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock an error by providing invalid data that might cause JSON.stringify to fail
      const invalidStatusDto = {
        type: 'pump',
        status: 'running',
        device_id: 'ESP32-003',
        // Add a circular reference to cause an error
        circular: {} as any,
      };
      invalidStatusDto.circular.self = invalidStatusDto;

      // Since the controller method doesn't throw, we need to simulate an error differently
      // Let's just test the error path by mocking console.log to throw
      const originalConsoleLog = console.log;
      console.log = jest.fn(() => {
        throw new Error('Console error');
      });

      const result = await controller.receiveDeviceStatus(deviceStatusDto);

      expect(result).toEqual({
        success: false,
        message: 'Console error',
        timestamp: expect.any(String),
      });

      // Restore console methods
      console.log = originalConsoleLog;
      consoleSpy.mockRestore();
    });
  });

  describe('input validation', () => {
    it('should handle invalid greenhouse ID format', async () => {
      const invalidGreenhouseId = 'invalid-uuid';

      // This would typically be handled by ValidationPipe in a real scenario
      // but we can test the controller's behavior with any string input
      mockPumpService.getPumpStatus.mockRejectedValue(
        new BadRequestException('Invalid UUID format'),
      );

      const result = await controller.getPumpStatus(invalidGreenhouseId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid UUID format');
    });

    it('should handle missing required fields in activation', async () => {
      const invalidDto = {} as ActivatePumpDto;

      mockPumpService.activatePump.mockRejectedValue(
        new BadRequestException('Validation failed'),
      );

      const result = await controller.activatePump(invalidDto);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Validation failed');
    });
  });

  describe('edge cases', () => {
    it('should handle concurrent activation requests', async () => {
      const activatePumpDto: ActivatePumpDto = {
        greenhouseId: mockGreenhouseId,
        duration: 300,
        waterAmount: 2.5,
        reason: 'manual',
      };

      mockPumpService.activatePump.mockRejectedValue(
        new BadRequestException('Pump is already active for this greenhouse'),
      );

      const result = await controller.activatePump(activatePumpDto);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Pump is already active for this greenhouse');
    });

    it('should handle very large limit values in history', async () => {
      const largeLimit = '99999';
      mockPumpService.getPumpHistory.mockResolvedValue([]);

      const result = await controller.getPumpHistory(
        mockGreenhouseId,
        largeLimit,
      );

      expect(result.success).toBe(true);
      expect(mockPumpService.getPumpHistory).toHaveBeenCalledWith(
        mockGreenhouseId,
        99999,
      );
    });

    it('should handle negative limit values in history', async () => {
      const negativeLimit = '-10';
      mockPumpService.getPumpHistory.mockResolvedValue([]);

      const result = await controller.getPumpHistory(
        mockGreenhouseId,
        negativeLimit,
      );

      expect(result.success).toBe(true);
      // Should handle negative values gracefully
      expect(mockPumpService.getPumpHistory).toHaveBeenCalledWith(
        mockGreenhouseId,
        -10,
      );
    });
  });
});
