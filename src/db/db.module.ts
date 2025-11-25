import { Module } from '@nestjs/common';
import { DrizzleService } from '@db/drizzle.service';
import { DbAdminController } from '@db/db.controller';

@Module({
    providers: [DrizzleService],
    controllers: [DbAdminController],
    exports: [DrizzleService],
})
export class DbModule { }
