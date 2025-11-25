import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@db/drizzle.service';
import { companies } from '@schema/companies';
import type { Company } from '@schema/companies';
import { eq } from 'drizzle-orm';

@Injectable()
export class CompaniesService {
    constructor(private readonly drizzleService: DrizzleService) { }

    async getAllCompanies(): Promise<Company[]> {
        return this.drizzleService.db.select().from(companies);
    }

    async getCompanyById(id: string): Promise<Company | null> {
        return this.drizzleService.db.select().from(companies).where(eq(companies.id, id)).limit(1);
    }

    async getCompanyBySlug(slug: string): Promise<Company | null> {
        return this.drizzleService.db.select().from(companies).where(eq(companies.slug, slug)).limit(1);
    }
}
