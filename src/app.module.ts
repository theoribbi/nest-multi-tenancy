import { MiddlewareConsumer, Module, RequestMethod, NestModule } from '@nestjs/common';
import { DbModule } from './db/db.module';
import { CompaniesModule } from './companies/companies.module';
import { UsersModule } from './users/users.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

@Module({
  imports: [DbModule, CompaniesModule, UsersModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
