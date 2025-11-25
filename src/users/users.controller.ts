import { Controller, Get, Post, Body, Param, Patch, Delete, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiCreatedResponse, ApiOkResponse, ApiNotFoundResponse, ApiTags } from '@nestjs/swagger';
import { UserDto, CreateUserDto } from './dto/user.dto';
import type { User } from '@schema/tenant/users';

@ApiTags('Users')
@Controller('companies/:companyId/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @ApiOkResponse({ type: UserDto, isArray: true })
  async getUsers(@Param('companyId') companyId: string): Promise<User[]> {
    return this.usersService.findAllForCompany(companyId);
  }

  @Get(':userId')
  @ApiOkResponse({ type: UserDto })
  @ApiNotFoundResponse()
  async getUser(
    @Param('companyId') companyId: string,
    @Param('userId') userId: string,
  ): Promise<User> {
    const user = await this.usersService.findOneForCompany(companyId, userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Post()
  @ApiCreatedResponse({ type: UserDto })
  async createUser(
    @Param('companyId') companyId: string,
    @Body() body: CreateUserDto,
  ): Promise<User> {
    return this.usersService.createForCompany(companyId, body);
  }

  @Patch(':userId')
  @ApiOkResponse({ type: UserDto })
  async updateUser(
    @Param('companyId') companyId: string,
    @Param('userId') userId: string,
    @Body() body: Partial<CreateUserDto>,
  ): Promise<User> {
    const updated = await this.usersService.updateForCompany(companyId, userId, body);
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return updated;
  }

  @Delete(':userId')
  @ApiOkResponse({ description: 'User deleted' })
  async deleteUser(
    @Param('companyId') companyId: string,
    @Param('userId') userId: string,
  ): Promise<{ ok: true }> {
    await this.usersService.removeForCompany(companyId, userId);
    return { ok: true };
  }
}
