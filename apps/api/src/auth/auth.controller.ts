import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthUserDto } from 'src/user/dto/user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  login(@Body() auth: AuthUserDto) {
    try {
      return this.authService.authenticate(auth);
    } catch (error) {
      throw error;
    }
  }
}
