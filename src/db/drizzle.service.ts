import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as publicSchema from './schema/public';
import * as tenantSchema from './schema/tenant';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as path from 'node:path';
import { companies } from './schema/public';

type DrizzleDb = NodePgDatabase<any>;

@Injectable()
export class DrizzleService implements OnModuleDestroy, OnModuleInit {
  private pool: Pool;

  public dbPublic: DrizzleDb;

  private tenantMigrationsFolder = path.join(
    process.cwd(),
    'drizzle',
    'tenant',
  );

  private publicMigrationsFolder = path.join(
    process.cwd(),
    'drizzle',
    'public',
  );

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    this.dbPublic = drizzle(this.pool, { schema: publicSchema });
  }

  async onModuleInit() {
    await this.migratePublic();
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  /**
   * Migrate public schema
   */
  private async migratePublic(): Promise<void> {
    console.log('Running public migrations from:', this.publicMigrationsFolder);
    const client = await this.pool.connect();
    try {
      const db = drizzle(client);
      await migrate(db, {
        migrationsFolder: this.publicMigrationsFolder,
        migrationsTable: '__drizzle_migrations_public',
      });
      console.log('✅ Public schema migrated');
    } catch (error) {
      console.error('❌ Public schema migration failed:', error);
    } finally {
      client.release();
    }
  }

  /**
   * Creation of a tenant schema + application of tenant migrations
   */
  async createTenantSchema(schemaName: string): Promise<void> {
    // Allow alphanumeric and underscores and hyphens
    if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(schemaName)) {
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
      // Reset search_path to public before releasing the client to the pool
      // Otherwise, subsequent queries using this client might fail finding public tables
      await client.query('SET search_path TO public');
      client.release();
    }
  }

  /**
   * Migrate all tenants
   */
  async migrateAllTenants(): Promise<void> {
    const rows = await this.dbPublic
      .select({ schemaName: companies.schemaName })
      .from(companies);

    for (const { schemaName } of rows) {
      await this.createTenantSchema(schemaName);
    }

    console.log(`✅ Migrated ${rows.length} tenants`);
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
      // Verify schema exists
      const schemaCheck = await client.query(
        `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
        [schemaName],
      );
      if (schemaCheck.rows.length === 0) {
        throw new Error(
          `Tenant schema "${schemaName}" does not exist. Please run migrations first via POST /admin/db/migrate-tenants`,
        );
      }

      await client.query('BEGIN');
      try {
        await client.query(`SET LOCAL search_path TO "${schemaName}", public`);
        const db = drizzle(client, { schema: tenantSchema });
        const result = await fn(db);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    } finally {
      client.release();
    }
  }
}
