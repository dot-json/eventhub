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
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { JwtAuthGuard } from './../guards';
import { RolesGuard } from './../guards';
import { Roles } from './../decorators';
import { UserRole } from 'generated/prisma';
import { ResponseBuilder } from '../common';
import { Request as RequestType } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return ResponseBuilder.successWithCount(
      users,
      'Users retrieved successfully',
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }
    const user = await this.usersService.findOne(userId);
    return ResponseBuilder.success(user, 'User retrieved successfully');
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  async update(
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
    @Request() req: RequestType & { user: { id: number } },
  ) {
    const user = await this.usersService.update(req.user.id, updateUserDto);
    return ResponseBuilder.success(user, 'User updated successfully');
  }

  @Put('password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updatePassword(
    @Body(ValidationPipe) updatePasswordDto: UpdatePasswordDto,
    @Request() req: RequestType & { user: { id: number } },
  ) {
    const result = await this.usersService.updatePassword(
      updatePasswordDto,
      req.user.id,
    );
    return ResponseBuilder.success(result, 'Password updated successfully');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }
    await this.usersService.remove(userId);
    return ResponseBuilder.successNoData('User deleted successfully');
  }
}
