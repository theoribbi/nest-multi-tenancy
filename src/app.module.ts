import { Module } from '@nestjs/common';
import { DbModule } from './db/db.module';
import { CompaniesModule } from './companies/companies.module';

@Module({
  imports: [DbModule, CompaniesModule],
})
export class AppModule {}
