import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UseGuards,
  Put,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { JwtAuthGuard } from './../guards';
import { RolesGuard } from './../guards';
import { Roles } from './../decorators';
import { UserRole } from 'generated/prisma';
import { ResponseBuilder } from '../common';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    try {
      const users = await this.usersService.findAll();
      return ResponseBuilder.successWithCount(
        users,
        'Users retrieved successfully',
      );
    } catch (error) {
      // Re-throw the original exception to maintain proper HTTP status codes
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        error.message || 'Failed to retrieve users',
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const userId = parseInt(id, 10);
      if (isNaN(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }
      const user = await this.usersService.findOne(userId);
      return ResponseBuilder.success(user, 'User retrieved successfully');
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        error.message || 'Failed to retrieve user',
      );
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
  ) {
    try {
      const userId = parseInt(id, 10);
      if (isNaN(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }
      const user = await this.usersService.update(userId, updateUserDto);
      return ResponseBuilder.success(user, 'User updated successfully');
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        error.message || 'Failed to update user',
      );
    }
  }

  @Put(':id/password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updatePassword(
    @Param('id') id: string,
    @Body(ValidationPipe) updatePasswordDto: UpdatePasswordDto,
  ) {
    try {
      const userId = parseInt(id, 10);
      if (isNaN(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }
      const result = await this.usersService.updatePassword(
        userId,
        updatePasswordDto,
      );
      return ResponseBuilder.success(result, 'Password updated successfully');
    } catch (error) {
      // Re-throw the original exception to maintain proper HTTP status codes
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      // For any other errors, throw a generic internal server error
      throw new InternalServerErrorException(
        error.message || 'Failed to update password',
      );
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    try {
      const userId = parseInt(id, 10);
      if (isNaN(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }
      await this.usersService.remove(userId);
      return ResponseBuilder.successNoData('User deleted successfully');
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        error.message || 'Failed to delete user',
      );
    }
  }
}
