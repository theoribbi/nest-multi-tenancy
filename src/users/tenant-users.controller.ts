import { Controller, Get, Post, Body, Param, Patch, Delete, NotFoundException, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiCreatedResponse, ApiOkResponse, ApiNotFoundResponse, ApiTags } from '@nestjs/swagger';
import { UserDto, CreateUserDto } from './dto/user.dto';
import type { User } from '@schema/tenant/users';
import { TenantSchema } from '../common/decorators/tenant.decorator';

@ApiTags('Tenant Users')
@Controller('users')
export class TenantUsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @ApiOkResponse({ type: UserDto, isArray: true })
  async getUsers(@TenantSchema() schemaName: string): Promise<User[]> {
    this.ensureTenant(schemaName);
    return this.usersService.findAll(schemaName);
  }

  @Get(':userId')
  @ApiOkResponse({ type: UserDto })
  @ApiNotFoundResponse()
  async getUser(
    @TenantSchema() schemaName: string,
    @Param('userId') userId: string,
  ): Promise<User> {
    this.ensureTenant(schemaName);
    const user = await this.usersService.findOne(schemaName, userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Post()
  @ApiCreatedResponse({ type: UserDto })
  async createUser(
    @TenantSchema() schemaName: string,
    @Body() body: CreateUserDto,
  ): Promise<User> {
    this.ensureTenant(schemaName);
    return this.usersService.create(schemaName, body);
  }

  @Patch(':userId')
  @ApiOkResponse({ type: UserDto })
  async updateUser(
    @TenantSchema() schemaName: string,
    @Param('userId') userId: string,
    @Body() body: Partial<CreateUserDto>,
  ): Promise<User> {
    this.ensureTenant(schemaName);
    const updated = await this.usersService.update(schemaName, userId, body);
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return updated;
  }

  @Delete(':userId')
  @ApiOkResponse({ description: 'User deleted' })
  async deleteUser(
    @TenantSchema() schemaName: string,
    @Param('userId') userId: string,
  ): Promise<{ ok: true }> {
    this.ensureTenant(schemaName);
    await this.usersService.remove(schemaName, userId);
    return { ok: true };
  }

  private ensureTenant(schemaName: string) {
      if (!schemaName) {
          throw new NotFoundException('Tenant context not found. Please access via subdomain.');
      }
  }
}

