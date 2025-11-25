import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DrizzleService } from '../../db/drizzle.service';
import { companies } from '../../db/schema/public/companies';
import { eq } from 'drizzle-orm';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly drizzle: DrizzleService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const host = req.headers.host;
    if (!host) {
      return next();
    }

    // Basic subdomain extraction (works for localhost and standard domains)
    // acme.localhost:3000 -> acme
    // my-company.domain.com -> my-company
    // localhost:3000 -> null
    
    const parts = host.split('.');
    
    // Handle localhost case specifically for dev
    // localhost:3000 => parts = ['localhost:3000'] => length 1 (no subdomain)
    // tenant.localhost:3000 => parts = ['tenant', 'localhost:3000'] => length 2
    
    // PROD/DEV handling logic might differ, but let's assume simple case:
    // If we have > 1 part (for localhost) or > 2 parts (for domain.com), the first part is subdomain
    
    let subdomain: string | null = null;

    if (host.includes('localhost')) {
        if (parts.length >= 2) {
            subdomain = parts[0];
        }
    } else {
        // domain.com logic (simplified)
        if (parts.length >= 3) {
            subdomain = parts[0];
        }
    }

    // Ignore 'www' or if no subdomain
    if (!subdomain || subdomain === 'www' || subdomain === 'api') {
      return next();
    }

    // Resolve tenant
    const result = await this.drizzle.dbPublic
        .select({ schemaName: companies.schemaName })
        .from(companies)
        .where(eq(companies.slug, subdomain))
        .limit(1);

    const tenant = result[0];

    if (!tenant) {
      throw new NotFoundException(`Tenant "${subdomain}" not found`);
    }

    // Attach tenant info to request
    req['tenantId'] = subdomain; // Using slug as ID for now, or could query full object
    req['tenantSchema'] = tenant.schemaName;

    next();
  }
}

