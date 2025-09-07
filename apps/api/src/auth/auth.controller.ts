import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { CaptchaService } from './captcha.service';
import { AuthUserDto } from 'src/user/dto/user.dto';
import { CaptchaDto, LoginWithCaptchaDto } from './dto/captcha.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly captchaService: CaptchaService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 5, ttl: 60000 } }) // 5 tentativas por minuto
  async login(@Body() auth: AuthUserDto) {
    try {
      return await this.authService.authenticate(auth);
    } catch (error) {
      throw error;
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 10, ttl: 60000 } }) // 10 tentativas por minuto
  async refresh(@Body() body: { refreshToken: string }) {
    try {
      return await this.authService.refreshAccessToken(body.refreshToken);
    } catch (error) {
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() body: { refreshToken: string }) {
    try {
      await this.authService.revokeRefreshToken(body.refreshToken);
      return { message: 'Logout successful' };
    } catch (error) {
      throw error;
    }
  }

  @Post('captcha/generate')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 10, ttl: 60000 } }) // 10 captchas por minuto
  async generateCaptcha() {
    try {
      const captcha = this.captchaService.generateCaptcha();
      return {
        id: captcha.id,
        // Não retornar o texto para o frontend - ele será gerado lá
        message: 'Captcha generated successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('captcha/validate')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 20, ttl: 60000 } }) // 20 validações por minuto
  async validateCaptcha(@Body() body: CaptchaDto & { id: string }) {
    try {
      const isValid = this.captchaService.validateCaptcha(
        body.id,
        body.captcha,
      );
      return { isValid };
    } catch (error) {
      throw error;
    }
  }

  @Post('login-with-captcha')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 3, ttl: 60000 } }) // 3 tentativas por minuto com captcha
  async loginWithCaptcha(
    @Body() auth: LoginWithCaptchaDto & { captchaId: string },
  ) {
    try {
      // A ReCAPTZ já faz validação server-side automaticamente
      // Aqui podemos adicionar validações adicionais se necessário

      // Proceder com login (ReCAPTZ já validou o captcha)
      return await this.authService.authenticate({
        email: auth.email,
        password: auth.password,
      });
    } catch (error) {
      throw error;
    }
  }
}
