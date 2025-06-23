import { Test, TestingModule } from '@nestjs/testing';
import { GreenhouseController } from './greenhouse.controller';
import { GreenhouseService } from './greenhouse.service';
import { JwtService } from '@nestjs/jwt';

const mockGreenhouseService = {
  create: jest.fn(),
  findAllByUser: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  generateQRCode: jest.fn(),
  configureFromQR: jest.fn(),
  receiveSensorData: jest.fn(),
  getSensorHistory: jest.fn(),
  getRealtimeStatus: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
  verifyAsync: jest.fn(),
};

const mockRequest = {
  user: {
    id: 'user-1',
    username: 'testuser',
    name: 'Test User',
    email: 'test@example.com',
    image: 'avatar.jpg',
  },
};

const mockGreenhouse = {
  id: 'greenhouse-1',
  name: 'Test Greenhouse',
  description: 'A test greenhouse',
  ownerId: 'user-1',
  isOnline: true,
  isConfigured: true,
};

describe('GreenhouseController', () => {
  let controller: GreenhouseController;
  let service: typeof mockGreenhouseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GreenhouseController],
      providers: [
        {
          provide: GreenhouseService,
          useValue: mockGreenhouseService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    controller = module.get<GreenhouseController>(GreenhouseController);
    service = module.get(GreenhouseService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new greenhouse', async () => {
      const createDto = {
        name: 'New Greenhouse',
        description: 'A new greenhouse',
        location: 'Test Location',
      };

      service.create.mockResolvedValue(mockGreenhouse);

      const result = await controller.create(mockRequest as any, createDto);

      expect(service.create).toHaveBeenCalledWith('user-1', createDto);
      expect(result).toEqual(mockGreenhouse);
    });
  });

  describe('findAll', () => {
    it('should return all greenhouses for user', async () => {
      const mockGreenhouses = [mockGreenhouse];
      service.findAllByUser.mockResolvedValue(mockGreenhouses);

      const result = await controller.findAll(mockRequest as any);

      expect(service.findAllByUser).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockGreenhouses);
    });
  });

  describe('findOne', () => {
    it('should return a specific greenhouse', async () => {
      service.findOne.mockResolvedValue(mockGreenhouse);

      const result = await controller.findOne(
        'greenhouse-1',
        mockRequest as any,
      );

      expect(service.findOne).toHaveBeenCalledWith('greenhouse-1', 'user-1');
      expect(result).toEqual(mockGreenhouse);
    });
  });

  describe('update', () => {
    it('should update a greenhouse', async () => {
      const updateDto = { name: 'Updated Greenhouse' };
      const updatedGreenhouse = { ...mockGreenhouse, ...updateDto };

      service.update.mockResolvedValue(updatedGreenhouse);

      const result = await controller.update(
        'greenhouse-1',
        mockRequest as any,
        updateDto,
      );

      expect(service.update).toHaveBeenCalledWith(
        'greenhouse-1',
        'user-1',
        updateDto,
      );
      expect(result).toEqual(updatedGreenhouse);
    });
  });

  describe('remove', () => {
    it('should delete a greenhouse', async () => {
      service.remove.mockResolvedValue(undefined);

      const result = await controller.remove(
        'greenhouse-1',
        mockRequest as any,
      );

      expect(service.remove).toHaveBeenCalledWith('greenhouse-1', 'user-1');
      expect(result).toEqual({ message: 'Greenhouse deleted successfully' });
    });
  });

  describe('generateQRCode', () => {
    it('should generate QR code for greenhouse', async () => {
      const mockQRResponse = {
        qrCodeData: 'data:image/png;base64,iVBORw0KGgoAAAA...',
        wifiSSID: 'TestWiFi',
        serverURL: 'http://localhost:3001',
        greenhouseId: 'greenhouse-1',
        configToken: 'config-token-123',
      };

      service.generateQRCode.mockResolvedValue(mockQRResponse);

      const result = await controller.generateQRCode(
        'greenhouse-1',
        mockRequest as any,
      );

      expect(service.generateQRCode).toHaveBeenCalledWith(
        'greenhouse-1',
        'user-1',
      );
      expect(result).toEqual(mockQRResponse);
    });
  });

  describe('configureFromQR', () => {
    it('should configure greenhouse from QR code', async () => {
      const configDto = {
        greenhouseId: 'greenhouse-1',
        wifiSSID: 'TestWiFi',
        wifiPassword: 'testpassword',
        deviceId: 'esp32-1',
        macAddress: '00:11:22:33:44:55',
      };

      const configuredGreenhouse = { ...mockGreenhouse, isConfigured: true };
      service.configureFromQR.mockResolvedValue(configuredGreenhouse);

      const result = await controller.configureFromQR(configDto);

      expect(service.configureFromQR).toHaveBeenCalledWith(configDto);
      expect(result).toEqual(configuredGreenhouse);
    });
  });

  describe('receiveSensorData', () => {
    it('should receive and process sensor data', async () => {
      const sensorData = {
        greenhouseId: 'greenhouse-1',
        airTemperature: 25.0,
        airHumidity: 60.0,
        soilMoisture: 50,
        lightIntensity: 800.0,
        waterLevel: 80.0,
      };

      const mockSensorReading = {
        id: 'reading-1',
        ...sensorData,
        timestamp: new Date(),
      };

      service.receiveSensorData.mockResolvedValue(mockSensorReading);

      const result = await controller.receiveSensorData(sensorData);

      expect(service.receiveSensorData).toHaveBeenCalledWith(sensorData);
      expect(result).toEqual(mockSensorReading);
    });
  });

  describe('getSensorHistory', () => {
    it('should return sensor history', async () => {
      const mockHistory = [
        {
          id: 'reading-1',
          airTemperature: 25.0,
          timestamp: new Date(),
        },
      ];

      service.getSensorHistory.mockResolvedValue(mockHistory);

      const result = await controller.getSensorHistory(
        'greenhouse-1',
        mockRequest as any,
        '24',
      );

      expect(service.getSensorHistory).toHaveBeenCalledWith(
        'greenhouse-1',
        'user-1',
        24,
      );
      expect(result).toEqual(mockHistory);
    });

    it('should use default hours if not provided', async () => {
      const mockHistory = [];
      service.getSensorHistory.mockResolvedValue(mockHistory);

      await controller.getSensorHistory('greenhouse-1', mockRequest as any);

      expect(service.getSensorHistory).toHaveBeenCalledWith(
        'greenhouse-1',
        'user-1',
        24,
      );
    });
  });

  describe('getRealtimeStatus', () => {
    it('should return real-time status', async () => {
      const mockStatus = {
        greenhouse: mockGreenhouse,
        currentConditions: {
          airTemperature: 25.0,
          airHumidity: 60.0,
        },
        targets: {
          temperature: 25.0,
          humidity: 60.0,
        },
        devices: [],
        alerts: [],
      };

      service.getRealtimeStatus.mockResolvedValue(mockStatus);

      const result = await controller.getRealtimeStatus(
        'greenhouse-1',
        mockRequest as any,
      );

      expect(service.getRealtimeStatus).toHaveBeenCalledWith(
        'greenhouse-1',
        'user-1',
      );
      expect(result).toEqual(mockStatus);
    });
  });
});
