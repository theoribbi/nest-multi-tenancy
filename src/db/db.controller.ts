import { Controller, Post } from '@nestjs/common';
import { DrizzleService } from './drizzle.service';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('admin/db')
@ApiTags('Admin - DB')
export class DbAdminController {
    constructor(private readonly drizzle: DrizzleService) { }

    @Post('migrate-tenants')
    @ApiOperation({ summary: 'Migrate all tenants' })
    @ApiOkResponse({ description: 'Tenants migrated successfully' })
    async migrateTenants(): Promise<{ ok: boolean }> {
        await this.drizzle.migrateAllTenants();
        return { ok: true } as { ok: boolean };
    }
}
