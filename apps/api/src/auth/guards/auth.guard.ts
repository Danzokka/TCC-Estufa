import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;
    const token = authorization && authorization.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Usar o mesmo segredo que foi usado para gerar o token
      const tokenPayload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'defaultSecret', // Deve ser o mesmo valor do auth.module.ts
      });
      request.user = {
        username: tokenPayload.username,
        image: tokenPayload.image,
        name: tokenPayload.name,
        email: tokenPayload.email,
        id: tokenPayload.id,
      };
      return true;
    } catch (error) {
      console.error('JWT Verification Error:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}

export type RequestAuthGuard = {
  user: {
    image: string;
    name: string;
    username: string;
    email: string;
    id: string;
  };
};
