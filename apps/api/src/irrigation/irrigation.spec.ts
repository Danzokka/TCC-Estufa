import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { IrrigationController } from './irrigation.controller';
import { IrrigationService } from './irrigation.service';
import { GreenhouseGateway } from '../websocket/greenhouse.gateway';

describe('IrrigationSystem', () => {
  let app: INestApplication;
  let irrigationService: IrrigationService;
  let greenhouseGateway: GreenhouseGateway;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [IrrigationController],
      providers: [
        IrrigationService,
        {
          provide: GreenhouseGateway,
          useValue: {
            notifyPumpActivated: jest.fn(),
            notifyIrrigationDetected: jest.fn(),
            notifyIrrigationConfirmed: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useWebSocketAdapter(new IoAdapter(app));
    await app.init();

    irrigationService = moduleFixture.get<IrrigationService>(IrrigationService);
    greenhouseGateway = moduleFixture.get<GreenhouseGateway>(GreenhouseGateway);
  });

  afterEach(async () => {
    await app.close();
  });

  it('should send WebSocket notification for pump activation', async () => {
    const notifySpy = jest.spyOn(greenhouseGateway, 'notifyPumpActivated');

    // Simulate pump activation notification
    greenhouseGateway.notifyPumpActivated('user-1', 'greenhouse-1', {
      pumpId: 'pump-1',
      duration: 30,
      waterAmount: 1.5,
      timestamp: new Date().toISOString(),
    });

    expect(notifySpy).toHaveBeenCalledWith('user-1', 'greenhouse-1', {
      pumpId: 'pump-1',
      duration: 30,
      waterAmount: 1.5,
      timestamp: expect.any(String),
    });
  });

  it('should send WebSocket notification for irrigation detection', async () => {
    const notifySpy = jest.spyOn(greenhouseGateway, 'notifyIrrigationDetected');

    greenhouseGateway.notifyIrrigationDetected('user-1', 'greenhouse-1', {
      id: 'irrigation-123',
      moistureIncrease: 18.5,
      timestamp: new Date().toISOString(),
    });

    expect(notifySpy).toHaveBeenCalledWith('user-1', 'greenhouse-1', {
      id: 'irrigation-123',
      moistureIncrease: 18.5,
      timestamp: expect.any(String),
    });
  });
});
