import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './../guards';
import { ResponseBuilder } from '../common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const authResponse = await this.authService.register(registerDto);
    return ResponseBuilder.success(
      authResponse,
      'User registered successfully',
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const authResponse = await this.authService.login(loginDto);
    return ResponseBuilder.success(authResponse, 'Login successful');
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: { user: { id: number } }) {
    const user = await this.authService.getProfile(req.user.id);
    return ResponseBuilder.success(user, 'Profile retrieved successfully');
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: { refresh_token: string }) {
    const tokens = await this.authService.refreshToken(body.refresh_token);
    return ResponseBuilder.success(tokens, 'Tokens refreshed successfully');
  }
}
