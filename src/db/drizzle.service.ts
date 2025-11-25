import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as publicSchema from './schema/public';
import * as tenantSchema from './schema/tenant';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as path from 'node:path';

type DrizzleDb = NodePgDatabase<any>;

@Injectable()
export class DrizzleService implements OnModuleDestroy {
  private pool: Pool;

  public dbPublic: DrizzleDb;

  private tenantMigrationsFolder = path.join(
    process.cwd(),
    'drizzle',
    'tenant',
  );

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    this.dbPublic = drizzle(this.pool, { schema: publicSchema });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  /**
   * Creation of a tenant schema + application of tenant migrations
   */
  async createTenantSchema(schemaName: string): Promise<void> {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schemaName)) {
      throw new Error(`Invalid schema name: ${schemaName}`);
    }

    const client = await this.pool.connect();
    try {
      await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

      await client.query(`SET search_path TO "${schemaName}"`);

      const db = drizzle(client);

      await migrate(db, {
        migrationsFolder: this.tenantMigrationsFolder,
        migrationsTable: `__drizzle_migrations_${schemaName}`,
      });

      console.log(`✅ Tenant "${schemaName}" created + migrated`);
    } finally {
      client.release();
    }
  }

  /**
   * Execute a function with a Drizzle db pointed on a tenant schema.
   */
  async withTenantDb<T>(
    schemaName: string,
    fn: (db: DrizzleDb) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET LOCAL search_path TO "${schemaName}", public`);
      const db = drizzle(client, { schema: tenantSchema });
      return await fn(db);
    } finally {
      client.release();
    }
  }
}
