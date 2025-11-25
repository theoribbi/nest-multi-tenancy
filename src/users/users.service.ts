import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DrizzleService } from '@db/drizzle.service';
import { companies } from '@schema/public/companies';
import { users, type User } from '@schema/tenant/users';
import { eq } from 'drizzle-orm';

@Injectable()
export class UsersService {
    constructor(private readonly drizzle: DrizzleService) { }

    /**
     * Get the schemaName of a company from its id (public.companies).
     */
    private async getSchemaNameForCompany(companyId: string): Promise<string> {
        const rows = await this.drizzle.dbPublic
            .select({ schemaName: companies.schemaName })
            .from(companies)
            .where(eq(companies.id, companyId))
            .limit(1);

        const row = rows[0];
        if (!row) {
            throw new NotFoundException(`Company ${companyId} not found`);
        }

        return row.schemaName;
    }

    // --- Methods using schemaName directly (for Tenant Context) ---

    async findAll(schemaName: string): Promise<User[]> {
        return this.drizzle.withTenantDb(schemaName, (db) => {
            return db.select().from(users);
        });
    }

    async findOne(schemaName: string, userId: string): Promise<User | null> {
        return this.drizzle.withTenantDb(schemaName, async (db) => {
            const rows = await db
                .select()
                .from(users)
                .where(eq(users.id, userId))
                .limit(1);

            return rows[0] ?? null;
        });
    }

    async create(schemaName: string, data: { email: string; firstName?: string; lastName?: string }): Promise<User> {
        return this.drizzle.withTenantDb(schemaName, async (db) => {
            try {
                const [created] = await db
                    .insert(users)
                    .values({
                        email: data.email,
                        firstName: data.firstName,
                        lastName: data.lastName,
                    })
                    .returning();

                return created;
            } catch (error: any) {
                // Check both direct code (pg error) and nested cause (drizzle wrapped error)
                const errorCode = error.code || error.cause?.code;
                if (errorCode === '23505') { // Postgres unique_violation
                    throw new ConflictException('Email already exists for this company');
                }
                throw error;
            }
        });
    }

    async update(schemaName: string, userId: string, data: Partial<{ email: string; firstName?: string; lastName?: string }>): Promise<User | null> {
        return this.drizzle.withTenantDb(schemaName, async (db) => {
            try {
                const [updated] = await db
                    .update(users)
                    .set(data)
                    .where(eq(users.id, userId))
                    .returning();

                return updated ?? null;
            } catch (error: any) {
                const errorCode = error.code || error.cause?.code;
                if (errorCode === '23505') {
                    throw new ConflictException('Email already exists for this company');
                }
                throw error;
            }
        });
    }

    async remove(schemaName: string, userId: string): Promise<void> {
        await this.drizzle.withTenantDb(schemaName, async (db) => {
            await db.delete(users).where(eq(users.id, userId));
        });
    }


    // --- Legacy Methods using companyId (Admin Context) ---

    async findAllForCompany(companyId: string): Promise<User[]> {
        const schemaName = await this.getSchemaNameForCompany(companyId);
        return this.findAll(schemaName);
    }

    async findOneForCompany(companyId: string, userId: string): Promise<User | null> {
        const schemaName = await this.getSchemaNameForCompany(companyId);
        return this.findOne(schemaName, userId);
    }

    async createForCompany(companyId: string, data: { email: string; firstName?: string; lastName?: string }): Promise<User> {
        const schemaName = await this.getSchemaNameForCompany(companyId);
        return this.create(schemaName, data);
    }

    async updateForCompany(companyId: string, userId: string, data: Partial<{ email: string; firstName?: string; lastName?: string }>): Promise<User | null> {
        const schemaName = await this.getSchemaNameForCompany(companyId);
        return this.update(schemaName, userId, data);
    }

    async removeForCompany(companyId: string, userId: string): Promise<void> {
        const schemaName = await this.getSchemaNameForCompany(companyId);
        return this.remove(schemaName, userId);
    }
}
