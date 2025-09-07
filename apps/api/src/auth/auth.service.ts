import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, RefreshToken } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { AuthUserDto } from 'src/user/dto/user.dto';
import { UserService } from 'src/user/user.service';
import { randomBytes, pbkdf2Sync } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async authenticate(auth: AuthUserDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email: auth.email,
        },
      });

      if (!user) {
        throw new BadRequestException('Usuário não encontrado');
      }

      // Split stored password into salt and stored hash
      const [salt, storedHash] = user.password.split('&');

      // Generate hash with provided password and retrieved salt
      const computedHash = pbkdf2Sync(
        auth.password,
        salt,
        100000,
        64,
        'sha512',
      ).toString('hex');

      if (computedHash !== storedHash) {
        throw new UnauthorizedException('Senha incorreta');
      }

      return this.signIn(user);
    } catch (error) {
      throw error;
    }
  }

  async signIn(user: User) {
    const tokenPayload = {
      image: user.image,
      name: user.name,
      username: user.username,
      email: user.email,
      id: user.id,
    };

    const accessToken = this.jwtService.sign(tokenPayload, {
      expiresIn: '15m', // Access token expira em 15 minutos
    });

    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      username: user.username,
      name: user.name,
      image: user.image,
      email: user.email,
      id: user.id,
    };
  }

  async generateRefreshToken(userId: string): Promise<string> {
    // Revogar todos os refresh tokens existentes do usuário
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });

    // Gerar novo refresh token
    const token = randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Expira em 30 dias

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  async refreshAccessToken(refreshToken: string) {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (
      !tokenRecord ||
      tokenRecord.isRevoked ||
      tokenRecord.expiresAt < new Date()
    ) {
      throw new ForbiddenException('Invalid or expired refresh token');
    }

    // Gerar novo access token
    const tokenPayload = {
      image: tokenRecord.user.image,
      name: tokenRecord.user.name,
      username: tokenRecord.user.username,
      email: tokenRecord.user.email,
      id: tokenRecord.user.id,
    };

    const accessToken = this.jwtService.sign(tokenPayload, {
      expiresIn: '15m',
    });

    return {
      accessToken,
      user: {
        id: tokenRecord.user.id,
        username: tokenRecord.user.username,
        name: tokenRecord.user.name,
        email: tokenRecord.user.email,
        image: tokenRecord.user.image,
      },
    };
  }

  async revokeRefreshToken(refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { isRevoked: true },
    });
  }

  async revokeAllUserTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }

  async getUserByToken(token: string) {
    try {
      const decodedToken = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: {
          id: decodedToken.id,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
