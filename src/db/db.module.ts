import { Module } from '@nestjs/common';
import { DrizzleService } from '@db/drizzle.service';

@Module({
    providers: [DrizzleService],
    exports: [DrizzleService],
})
export class DbModule { }
