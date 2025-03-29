import { Body, Controller, Post } from '@nestjs/common';
import { SensorService } from './sensor.service';
import { CreateSensorDataDto } from './dto/CreateSensorDataDto';

@Controller('sensor')
export class SensorController {
  constructor(private readonly sensorService: SensorService) {}

  @Post()
  sendData(@Body() data: CreateSensorDataDto) {
    try {
      
      this.sensorService.sendData(data);
      return { message: 'Data sent successfully' };
    } catch (error) {
      console.error('Error sending data:', error);
      return { message: 'Error sending data', error: error.message };
    }
  }

}
