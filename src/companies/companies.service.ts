import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@db/drizzle.service';
import { companies } from '@db/schema/public/companies';
import type { Company } from '@db/schema/public/companies';
import { eq } from 'drizzle-orm';

@Injectable()
export class CompaniesService {
    constructor(private readonly drizzleService: DrizzleService) { }

    async getAllCompanies(): Promise<Company[]> {
        return this.drizzleService.dbPublic.select().from(companies);
    }

    async getCompanyById(id: string): Promise<Company | null> {
        const result = await this.drizzleService.dbPublic
            .select()
            .from(companies)
            .where(eq(companies.id, id))
            .limit(1);
        return result[0] ?? null;
    }

    async getCompanyBySlug(slug: string): Promise<Company | null> {
        const result = await this.drizzleService.dbPublic
            .select()
            .from(companies)
            .where(eq(companies.slug, slug))
            .limit(1);

        return result[0] ?? null;
    }

    async createCompany(input: { name: string; slug: string }) {
        const schemaName = `c_${input.slug}`;

        const [company] = await this.drizzleService.dbPublic
            .insert(companies)
            .values({
                name: input.name,
                slug: input.slug,
                schemaName,
            })
            .returning();

        await this.drizzleService.createTenantSchema(schemaName);

        return company;
    }

}
