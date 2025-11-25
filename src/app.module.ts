import { Module } from '@nestjs/common';
import { DbModule } from './db/db.module';
import { CompaniesModule } from './companies/companies.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [DbModule, CompaniesModule, UsersModule],
})
export class AppModule {}
