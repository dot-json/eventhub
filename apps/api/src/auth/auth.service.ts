import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService, SafeUser } from './../users';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { UserRole } from '../../generated/prisma';

export interface AuthResponse {
  user: SafeUser;
  access_token: string;
  refresh_token: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    try {
      const createUserDto = {
        ...registerDto,
        role: registerDto.role || UserRole.CUSTOMER,
      };

      if (createUserDto.role === UserRole.ADMIN) {
        throw new UnauthorizedException('Admin role is not allowed');
      }

      const user = await this.usersService.create(createUserDto);
      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      return {
        user,
        access_token: this.jwtService.sign(payload),
        refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
      };
    } catch (error) {
      if (error.message.includes('email already exists')) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.blocked_at !== null) {
      throw new UnauthorizedException('Account is blocked');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      user,
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<SafeUser | null> {
    try {
      const userWithPassword = await this.usersService.findByEmail(email);
      if (
        userWithPassword &&
        (await this.usersService.validatePassword(
          password,
          userWithPassword.password,
        ))
      ) {
        const { password: _, ...safeUser } = userWithPassword;
        return safeUser as SafeUser;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async getProfile(userId: number): Promise<SafeUser> {
    return this.usersService.findOne(userId);
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<Pick<AuthResponse, 'access_token' | 'refresh_token'>> {
    try {
      const decoded = this.jwtService.verify(refreshToken) as JwtPayload;

      const user = await this.usersService.findOne(decoded.sub);

      if (!user || user.blocked_at !== null) {
        throw new UnauthorizedException('Invalid user or account blocked');
      }

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      return {
        access_token: this.jwtService.sign(payload),
        refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
