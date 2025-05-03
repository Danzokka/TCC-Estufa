import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
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
        throw new BadRequestException('User not found');
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
        throw new UnauthorizedException('Invalid credentials');
      }

      return this.signIn(user);
    } catch (error) {
      throw error;
    }
  }

  async signIn(user: User) {
    const tokenPayload = {
      username: user.username,
      email: user.email,
      id: user.id,
    };

    const accessToken = this.jwtService.sign(tokenPayload);

    return {
      accessToken,
      username: user.username,
      email: user.email,
      id: user.id,
    };
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
