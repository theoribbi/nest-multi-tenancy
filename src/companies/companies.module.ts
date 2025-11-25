import { Module } from '@nestjs/common';
import { CompaniesService } from '@companies/companies.service';
import { CompaniesController } from '@companies/companies.controller';
import { DbModule } from '@db/db.module';

@Module({
  providers: [CompaniesService],
  controllers: [CompaniesController],
  imports: [DbModule],
})
export class CompaniesModule { }
