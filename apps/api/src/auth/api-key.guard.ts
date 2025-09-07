import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'] as string;
    const origin = request.headers.origin || request.headers.referer;

    // Permitir localhost para testes
    const isLocalhost =
      origin?.includes('localhost') || origin?.includes('127.0.0.1') || !origin; // Para testes diretos sem origin

    // Se for localhost, permitir acesso
    if (isLocalhost) {
      return true;
    }

    // Para outros domínios, verificar API key
    const validApiKey = process.env.API_KEY;

    if (!validApiKey) {
      throw new ForbiddenException('API key not configured');
    }

    if (!apiKey || apiKey !== validApiKey) {
      throw new ForbiddenException('Invalid or missing API key');
    }

    return true;
  }
}
