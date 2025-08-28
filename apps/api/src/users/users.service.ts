import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { Prisma, User, UserRole } from '../../generated/prisma';
import { QueryUsersDto } from './dto/query-users.dto';
import * as bcrypt from 'bcryptjs';

export type SafeUser = Omit<User, 'password'>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves all users (excluding passwords)
   */
  async findAll(queryDto: QueryUsersDto): Promise<{
    users: SafeUser[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const {
      search,
      role,
      sort_by = 'created_desc',
      limit = 50,
      page = 1,
    } = queryDto;

    const offset = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { org_name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    switch (sort_by) {
      case 'created_asc':
        orderBy.created_at = 'asc';
        break;
      case 'created_desc':
        orderBy.created_at = 'desc';
        break;
      default:
        orderBy.created_at = 'desc';
    }

    const users = await this.prisma.user.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        org_name: true,
        role: true,
        blocked_at: true,
        created_at: true,
        updated_at: true,
      },
    });

    const total = await this.prisma.user.count({ where });

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  }

  /**
   * Finds a user by ID (excluding password)
   */
  async findOne(id: number): Promise<SafeUser> {
    if (!id || typeof id !== 'number') {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        org_name: true,
        role: true,
        blocked_at: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    return user;
  }

  /**
   * Creates a new user with hashed password
   */
  async create(createUserDto: CreateUserDto): Promise<SafeUser> {
    await this.validateEmailUniqueness(createUserDto.email);

    const hashedPassword = await this.hashPassword(createUserDto.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: createUserDto.email,
          password: hashedPassword,
          first_name: createUserDto.first_name,
          last_name: createUserDto.last_name,
          org_name: createUserDto.org_name,
          role: createUserDto.role || UserRole.CUSTOMER,
        },
      });

      return this.excludePassword(user);
    } catch (error) {
      throw new BadRequestException('Failed to create user');
    }
  }

  /**
   * Updates a user by ID
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<SafeUser> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updateData: Partial<UpdateUserDto> = {
      ...updateUserDto,
    };

    if (updateUserDto.role && updateUserDto.role !== UserRole.ADMIN) {
      updateData.role = updateUserDto.role as UserRole;
    }

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });

      return this.excludePassword(user);
    } catch (error) {
      throw new BadRequestException('Failed to update user');
    }
  }

  /**
   * Updates a user's password
   */
  async updatePassword(
    updatePasswordDto: UpdatePasswordDto,
    id: number,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Verify current password
    const isCurrentPasswordValid = await this.validatePassword(
      updatePasswordDto.current_password,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await this.hashPassword(
      updatePasswordDto.new_password,
    );

    try {
      await this.prisma.user.update({
        where: { id },
        data: { password: hashedNewPassword },
      });

      return { message: 'Password updated successfully' };
    } catch (error) {
      throw new BadRequestException('Failed to update password');
    }
  }

  /**
   * Deletes a user by ID
   */
  async remove(id: number): Promise<{ message: string }> {
    if (!id) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    try {
      await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      throw new BadRequestException('Failed to delete user');
    }

    return { message: 'User deleted successfully' };
  }

  /**
   * Counts total number of users
   */
  async count(): Promise<number> {
    return this.prisma.user.count();
  }

  /**
   * Finds users by role
   */
  async findByRole(role: UserRole): Promise<SafeUser[]> {
    const users = await this.prisma.user.findMany({
      where: { role },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        org_name: true,
        role: true,
        blocked_at: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return users;
  }

  /**
   * Finds a user by email (including password for authentication)
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Validates password against hash
   */
  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Private helper methods

  /**
   * Hashes a password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Validates that an email is unique
   */
  private async validateEmailUniqueness(email: string): Promise<void> {
    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
  }

  /**
   * Removes password from user object
   */
  private excludePassword(user: User): SafeUser {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
