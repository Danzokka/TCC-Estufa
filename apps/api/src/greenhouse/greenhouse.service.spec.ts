import { Test, TestingModule } from '@nestjs/testing';
import { GreenhouseService } from './greenhouse.service';
import { PrismaService } from '../prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// Mock data
const mockUser = {
  id: 'user-1',
  username: 'testuser',
  name: 'Test User',
  email: 'test@example.com',
  image: 'avatar.jpg',
  password: 'hashed',
  datecreated: new Date(),
  dateupdated: new Date(),
};

const mockGreenhouse = {
  id: 'greenhouse-1',
  name: 'Test Greenhouse',
  description: 'A test greenhouse',
  location: 'Test Location',
  ownerId: 'user-1',
  currentTemperature: 25.0,
  currentHumidity: 60.0,
  currentSoilMoisture: 50,
  currentLightIntensity: 800.0,
  currentWaterLevel: 80.0,
  targetTemperature: 25.0,
  targetHumidity: 60.0,
  targetSoilMoisture: 50,
  minWaterLevel: 20.0,
  deviceId: 'esp32-1',
  wifiSSID: 'TestWiFi',
  wifiPassword: 'encrypted-password',
  isOnline: true,
  lastDataUpdate: new Date(),
  qrCodeData: null,
  qrCodeGeneratedAt: null,
  isConfigured: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSensorReading = {
  id: 'reading-1',
  greenhouseId: 'greenhouse-1',
  airTemperature: 25.0,
  airHumidity: 60.0,
  soilMoisture: 50,
  soilTemperature: 23.0,
  lightIntensity: 800.0,
  waterLevel: 80.0,
  waterReserve: 90.0,
  deviceId: 'esp32-1',
  batteryLevel: 85.0,
  signalStrength: -45,
  timestamp: new Date(),
  isValid: true,
  errorMessage: null,
};

// Mock PrismaService
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
  },
  greenhouse: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  greenhouseSensorReading: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  device: {
    updateMany: jest.fn(),
    upsert: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('GreenhouseService', () => {
  let service: GreenhouseService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GreenhouseService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<GreenhouseService>(GreenhouseService);
    prisma = module.get(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new greenhouse', async () => {
      const createDto = {
        name: 'New Greenhouse',
        description: 'A new greenhouse',
        location: 'Test Location',
        wifiSSID: 'TestWiFi',
        wifiPassword: 'testpassword',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.greenhouse.create.mockResolvedValue(mockGreenhouse);

      const result = await service.create('user-1', createDto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(prisma.greenhouse.create).toHaveBeenCalled();
      expect(result).toEqual(mockGreenhouse);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const createDto = {
        name: 'New Greenhouse',
      };

      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.create('invalid-user', createDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAllByUser', () => {
    it('should return all greenhouses for a user', async () => {
      const mockGreenhousesWithDetails = [
        {
          ...mockGreenhouse,
          owner: mockUser,
          _count: { sensorReadings: 10, devices: 1 },
          sensorReadings: [mockSensorReading],
        },
      ];

      prisma.greenhouse.findMany.mockResolvedValue(mockGreenhousesWithDetails);

      const result = await service.findAllByUser('user-1');

      expect(prisma.greenhouse.findMany).toHaveBeenCalledWith({
        where: { ownerId: 'user-1' },
        include: {
          owner: true,
          _count: {
            select: {
              sensorReadings: true,
              devices: true,
            },
          },
          sensorReadings: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
      });
      expect(result[0].latestReading).toEqual(mockSensorReading);
    });
  });

  describe('findOne', () => {
    it('should return a greenhouse if user owns it', async () => {
      const mockGreenhouseWithDetails = {
        ...mockGreenhouse,
        owner: mockUser,
        devices: [],
        _count: { sensorReadings: 10, devices: 1 },
        sensorReadings: [mockSensorReading],
      };

      prisma.greenhouse.findFirst.mockResolvedValue(mockGreenhouseWithDetails);

      const result = await service.findOne('greenhouse-1', 'user-1');

      expect(prisma.greenhouse.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'greenhouse-1',
          ownerId: 'user-1',
        },
        include: {
          owner: true,
          devices: true,
          _count: {
            select: {
              sensorReadings: true,
              devices: true,
            },
          },
          sensorReadings: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
      });
      expect(result.latestReading).toEqual(mockSensorReading);
    });

    it('should throw NotFoundException if greenhouse not found', async () => {
      prisma.greenhouse.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('receiveSensorData', () => {
    it('should create sensor reading and update greenhouse', async () => {
      const sensorData = {
        greenhouseId: 'greenhouse-1',
        airTemperature: 26.0,
        airHumidity: 65.0,
        soilMoisture: 55,
        lightIntensity: 850.0,
        waterLevel: 75.0,
      };

      prisma.greenhouse.findUnique.mockResolvedValue({
        ...mockGreenhouse,
        isConfigured: true,
      });
      prisma.greenhouseSensorReading.create.mockResolvedValue(
        mockSensorReading,
      );
      prisma.greenhouse.update.mockResolvedValue(mockGreenhouse);

      const result = await service.receiveSensorData(sensorData);

      expect(prisma.greenhouse.findUnique).toHaveBeenCalledWith({
        where: { id: 'greenhouse-1' },
      });
      expect(prisma.greenhouseSensorReading.create).toHaveBeenCalled();
      expect(prisma.greenhouse.update).toHaveBeenCalledWith({
        where: { id: 'greenhouse-1' },
        data: expect.objectContaining({
          currentTemperature: 26.0,
          currentHumidity: 65.0,
          isOnline: true,
        }),
      });
      expect(result).toEqual(mockSensorReading);
    });

    it('should throw NotFoundException if greenhouse not found', async () => {
      const sensorData = {
        greenhouseId: 'invalid-id',
        airTemperature: 26.0,
        airHumidity: 65.0,
        soilMoisture: 55,
        lightIntensity: 850.0,
        waterLevel: 75.0,
      };

      prisma.greenhouse.findUnique.mockResolvedValue(null);

      await expect(service.receiveSensorData(sensorData)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if greenhouse not configured', async () => {
      const sensorData = {
        greenhouseId: 'greenhouse-1',
        airTemperature: 26.0,
        airHumidity: 65.0,
        soilMoisture: 55,
        lightIntensity: 850.0,
        waterLevel: 75.0,
      };

      prisma.greenhouse.findUnique.mockResolvedValue({
        ...mockGreenhouse,
        isConfigured: false,
      });

      await expect(service.receiveSensorData(sensorData)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('generateQRCode', () => {
    it('should generate QR code for configured greenhouse', async () => {
      const mockGreenhouseWithDetails = {
        ...mockGreenhouse,
        owner: mockUser,
        devices: [],
        _count: { sensorReadings: 10, devices: 1 },
        sensorReadings: [mockSensorReading],
        wifiSSID: 'TestWiFi',
        wifiPassword: 'test:encryptedpassword',
      };

      prisma.greenhouse.findFirst.mockResolvedValue(mockGreenhouseWithDetails);
      prisma.greenhouse.update.mockResolvedValue(mockGreenhouse);

      // Mock the encryption/decryption (simplified for testing)
      jest
        .spyOn(service as any, 'decryptPassword')
        .mockReturnValue('testpassword');

      const result = await service.generateQRCode('greenhouse-1', 'user-1');

      expect(result).toHaveProperty('qrCodeData');
      expect(result).toHaveProperty('wifiSSID', 'TestWiFi');
      expect(result).toHaveProperty('greenhouseId', 'greenhouse-1');
      expect(result).toHaveProperty('configToken');
    });

    it('should throw BadRequestException if WiFi not configured', async () => {
      const mockGreenhouseWithDetails = {
        ...mockGreenhouse,
        owner: mockUser,
        devices: [],
        _count: { sensorReadings: 10, devices: 1 },
        sensorReadings: [mockSensorReading],
        wifiSSID: null,
        wifiPassword: null,
      };

      prisma.greenhouse.findFirst.mockResolvedValue(mockGreenhouseWithDetails);

      await expect(
        service.generateQRCode('greenhouse-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getRealtimeStatus', () => {
    it('should return real-time greenhouse status', async () => {
      const mockGreenhouseWithDetails = {
        ...mockGreenhouse,
        owner: mockUser,
        devices: [],
        _count: { sensorReadings: 10, devices: 1 },
        sensorReadings: [mockSensorReading],
      };

      const mockDevices = [
        {
          id: 'device-1',
          name: 'ESP32 Device',
          type: 'esp32',
          isOnline: true,
          lastSeen: new Date(),
          batteryLevel: 85.0,
        },
      ];

      prisma.greenhouse.findFirst.mockResolvedValue(mockGreenhouseWithDetails);
      prisma.greenhouseSensorReading.findFirst.mockResolvedValue(
        mockSensorReading,
      );
      prisma.device.findMany.mockResolvedValue(mockDevices);

      const result = await service.getRealtimeStatus('greenhouse-1', 'user-1');

      expect(result).toHaveProperty('greenhouse');
      expect(result).toHaveProperty('currentConditions', mockSensorReading);
      expect(result).toHaveProperty('targets');
      expect(result).toHaveProperty('devices', mockDevices);
      expect(result).toHaveProperty('alerts');
    });
  });
});
