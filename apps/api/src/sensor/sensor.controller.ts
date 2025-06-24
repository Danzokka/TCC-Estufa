import { Body, Controller, Get, Post } from '@nestjs/common';
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

  @Get()
  async getData() {
    try {
      const data = await this.sensorService.getData();
      return { message: 'Data retrieved successfully', data };
    } catch (error) {
      console.error('Error retrieving data:', error);
      return { message: 'Error retrieving data', error: error.message };
    }
  }

}
