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
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from './../guards';
import { RolesGuard } from './../guards';
import { Roles } from './../decorators';
import { UserRole } from 'generated/prisma';
import { ApiResponse, ResponseBuilder } from '../common';

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

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
  ) {
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }
    const user = await this.usersService.update(userId, updateUserDto);
    return ResponseBuilder.success(user, 'User updated successfully');
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
