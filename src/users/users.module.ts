import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TenantUsersController } from './tenant-users.controller';
import { DbModule } from '@db/db.module';

@Module({
  imports: [DbModule],
  controllers: [UsersController, TenantUsersController],
  providers: [UsersService],
})
export class UsersModule {}
