import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@schema/index';

@Injectable()
export class DrizzleService implements OnModuleDestroy {
    private pool: Pool;
    public db;

    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });

        this.db = drizzle(this.pool, { schema });
    }

    async onModuleDestroy() {
        await this.pool.end();
    }
}
